-- Request dates remain editable until an administrator explicitly locks them.
create table public.request_date_locks (
 request_date date primary key,
 locked_by uuid not null references public.profiles(id),
 locked_at timestamptz not null default now()
);
alter table public.request_date_locks enable row level security;
create policy request_date_locks_select_active on public.request_date_locks
 for select to authenticated using (public.current_profile_is_active());
grant select on public.request_date_locks to authenticated;
revoke insert, update, delete on public.request_date_locks from public, anon, authenticated;

create function public.set_request_date_access(p_start date, p_end date, p_locked boolean)
returns integer language plpgsql security definer set search_path = public as $$
begin
 if not public.current_profile_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_start is null or p_end is null or p_locked is null or p_end < p_start or p_end - p_start > 365 then
  raise exception 'Select a valid date range of up to 366 days' using errcode='22023';
 end if;
 -- Serialize closures with saves, so a save cannot straddle a date closure.
 perform pg_advisory_xact_lock(20261015, 1);
 if p_locked then
  insert into public.request_date_locks(request_date,locked_by)
   select p_start + n, auth.uid() from generate_series(0, p_end-p_start) n
   on conflict (request_date) do nothing;
 else
  delete from public.request_date_locks where request_date between p_start and p_end;
 end if;
 return p_end - p_start + 1;
end; $$;
revoke all on function public.set_request_date_access(date,date,boolean) from public, anon;
grant execute on function public.set_request_date_access(date,date,boolean) to authenticated;

-- Staff writes must use the validated transaction below. Direct table writes could
-- otherwise bypass closure serialization or cascade-delete protected requests.
revoke insert, update, delete on public.weekly_request_groups, public.request_entries, public.request_entry_codes from public, anon, authenticated;
drop policy weekly_groups_insert_owner_staff on public.weekly_request_groups;
drop policy weekly_groups_update_owner_staff on public.weekly_request_groups;
drop policy weekly_groups_delete_owner_staff on public.weekly_request_groups;
drop policy request_entries_insert_owner_future_staff on public.request_entries;
drop policy request_entries_update_owner_future_staff on public.request_entries;
drop policy request_entries_delete_owner_future_staff on public.request_entries;
drop policy entry_codes_insert_owner_future_staff on public.request_entry_codes;
drop policy entry_codes_delete_owner_future_staff on public.request_entry_codes;

-- Older browser tabs omit the edit scope; reject them until refreshed instead of
-- treating omitted historical entries as deletions under the new date rules.
drop function public.save_weekly_requests(date,text,jsonb,timestamptz);
create function public.save_weekly_requests(p_week_start date,p_remark text,p_entries jsonb,p_expected_updated_at timestamptz default null,p_editable_dates date[] default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
 v_owner uuid := auth.uid(); v_group_id uuid; v_current_updated_at timestamptz;
 v_current_remark text; v_entry jsonb; v_entry_id uuid; v_code text; v_has_protected_entries boolean;
begin
 if not public.current_profile_can_edit_requests() then raise exception 'Staff request editing is locked' using errcode='42501'; end if;
 if p_editable_dates is null or cardinality(p_editable_dates)=0 then raise exception 'Refresh the calendar before saving this week.' using errcode='55000'; end if;
 if p_week_start is null or extract(isodow from p_week_start) <> 1 then raise exception 'Week must start on Monday' using errcode='22023'; end if;
 if p_entries is null or jsonb_typeof(p_entries) <> 'array' then raise exception 'Entries must be an array' using errcode='22023'; end if;
 if p_remark is null or (jsonb_array_length(p_entries)>0 and btrim(p_remark)='') then raise exception 'A weekly remark is required' using errcode='23514'; end if;
 if exists(select 1 from jsonb_array_elements(p_entries) e where (e->>'date') is null or public.week_start_for((e->>'date')::date) <> p_week_start or jsonb_typeof(e->'codes') is distinct from 'array') then
  raise exception 'Invalid request date or codes' using errcode='22023';
 end if;
 if exists(select 1 from jsonb_array_elements(p_entries) e where jsonb_array_length(e->'codes')=0) then raise exception 'Choose request codes' using errcode='22023'; end if;
 if cardinality(p_editable_dates)>7 or exists(select 1 from unnest(p_editable_dates) d where d is null or public.week_start_for(d)<>p_week_start)
  or exists(select 1 from jsonb_array_elements(p_entries) e where not ((e->>'date')::date=any(p_editable_dates))) then
  raise exception 'Invalid editable date scope' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(20261015, 1);
 if exists(select 1 from unnest(p_editable_dates) d join public.request_date_locks l on l.request_date=d) then
  raise exception 'Request dates are locked. Refresh the calendar before saving.' using errcode='55000';
 end if;
 select id,updated_at,remark into v_group_id,v_current_updated_at,v_current_remark
  from public.weekly_request_groups where owner_id=v_owner and week_start=p_week_start for update;
 -- A missing expected timestamp must not overwrite an existing group either.
 if (v_group_id is not null and p_expected_updated_at is distinct from v_current_updated_at)
  or (v_group_id is null and p_expected_updated_at is not null) then
  raise exception 'This week changed in another session' using errcode='40001';
 end if;
 select exists(select 1 from public.request_entries e where e.group_id=v_group_id and not (e.request_date=any(p_editable_dates))) into v_has_protected_entries;
 if v_has_protected_entries and btrim(p_remark) is distinct from btrim(v_current_remark) then
  raise exception 'The weekly remark is shared with locked requests and cannot be changed.' using errcode='55000';
 end if;
 if v_group_id is null and jsonb_array_length(p_entries)>0 then
  insert into public.weekly_request_groups(owner_id,week_start,remark) values(v_owner,p_week_start,btrim(p_remark)) returning id into v_group_id;
 elsif v_group_id is not null then
  if jsonb_array_length(p_entries)>0 or v_has_protected_entries then
   update public.weekly_request_groups set remark=case when v_has_protected_entries then v_current_remark else btrim(p_remark) end where id=v_group_id;
  end if;
 end if;
 if v_group_id is not null then
  -- Only explicitly submitted open dates may be replaced. This also protects
  -- dates unlocked since a browser tab was opened, which are outside its scope.
  delete from public.request_entries e where e.group_id=v_group_id
   and e.request_date=any(p_editable_dates);
  for v_entry in select value from jsonb_array_elements(p_entries) loop
   insert into public.request_entries(group_id,owner_id,request_date) values(v_group_id,v_owner,(v_entry->>'date')::date) returning id into v_entry_id;
   for v_code in select value #>> '{}' from jsonb_array_elements(v_entry->'codes') loop
    insert into public.request_entry_codes(request_entry_id,code) values(v_entry_id,v_code);
   end loop;
  end loop;
  if not exists(select 1 from public.request_entries where group_id=v_group_id) then
   delete from public.weekly_request_groups where id=v_group_id; return null;
  end if;
 end if;
 return v_group_id;
end; $$;
revoke all on function public.save_weekly_requests(date,text,jsonb,timestamptz,date[]) from public, anon;
grant execute on function public.save_weekly_requests(date,text,jsonb,timestamptz,date[]) to authenticated;
