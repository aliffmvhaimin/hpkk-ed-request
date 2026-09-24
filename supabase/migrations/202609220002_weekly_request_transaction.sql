create or replace function public.save_weekly_requests(
  p_week_start date,
  p_remark text,
  p_entries jsonb,
  p_expected_updated_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_group_id uuid;
  v_current_updated_at timestamptz;
  v_entry jsonb;
  v_entry_id uuid;
  v_code text;
begin
  if not public.current_profile_is_staff() then raise exception 'Only active staff may edit requests' using errcode = '42501'; end if;
  if extract(isodow from p_week_start) <> 1 then raise exception 'Week must start on Monday' using errcode = '22023'; end if;
  if (p_week_start + 6) < public.kl_today() then raise exception 'Past weeks cannot be edited' using errcode = '42501'; end if;
  if jsonb_typeof(p_entries) <> 'array' then raise exception 'Entries must be an array' using errcode = '22023'; end if;
  if jsonb_array_length(p_entries) > 0 and btrim(p_remark) = '' then raise exception 'A weekly remark is required' using errcode = '23514'; end if;
  if exists(select 1 from jsonb_array_elements(p_entries) e where (e->>'date')::date < public.kl_today() or public.week_start_for((e->>'date')::date) <> p_week_start or jsonb_typeof(e->'codes') <> 'array' or jsonb_array_length(e->'codes') = 0) then raise exception 'Invalid or ineligible request date' using errcode = '22023'; end if;

  select id, updated_at into v_group_id, v_current_updated_at from public.weekly_request_groups where owner_id = v_owner and week_start = p_week_start for update;
  if v_group_id is not null and p_expected_updated_at is not null and v_current_updated_at <> p_expected_updated_at then raise exception 'This week changed in another session' using errcode = '40001'; end if;
  if v_group_id is null and jsonb_array_length(p_entries) > 0 then
    insert into public.weekly_request_groups(owner_id, week_start, remark) values(v_owner, p_week_start, btrim(p_remark)) returning id into v_group_id;
  elsif v_group_id is not null and jsonb_array_length(p_entries) > 0 then
    update public.weekly_request_groups set remark = btrim(p_remark) where id = v_group_id;
  end if;

  if v_group_id is not null then
    delete from public.request_entries where group_id = v_group_id and request_date >= public.kl_today();
    for v_entry in select value from jsonb_array_elements(p_entries) loop
      insert into public.request_entries(group_id, owner_id, request_date) values(v_group_id, v_owner, (v_entry->>'date')::date) returning id into v_entry_id;
      for v_code in select value #>> '{}' from jsonb_array_elements(v_entry->'codes') loop
        insert into public.request_entry_codes(request_entry_id, code) values(v_entry_id, v_code);
      end loop;
    end loop;
    if not exists(select 1 from public.request_entries where group_id = v_group_id) then delete from public.weekly_request_groups where id = v_group_id; return null; end if;
  end if;
  return v_group_id;
end;
$$;
revoke all on function public.save_weekly_requests(date,text,jsonb,timestamptz) from public;
grant execute on function public.save_weekly_requests(date,text,jsonb,timestamptz) to authenticated;
