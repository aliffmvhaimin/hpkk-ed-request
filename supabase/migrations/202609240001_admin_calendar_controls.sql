alter table public.profiles
  add column role_name text not null default 'Staff',
  add column can_edit_requests boolean not null default true;

update public.profiles set role_name = case when role = 'admin' then 'Administrator' else 'Staff' end;
alter table public.profiles add constraint profiles_role_name_trimmed check (role_name = btrim(role_name) and role_name <> '');

create table public.calendar_date_remarks (
  remark_date date primary key,
  remark text not null,
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_date_remarks_text_required check (btrim(remark) <> '')
);
create trigger calendar_date_remarks_set_updated_at before update on public.calendar_date_remarks for each row execute function public.set_updated_at();
alter table public.calendar_date_remarks enable row level security;
create policy calendar_date_remarks_select_shared on public.calendar_date_remarks for select to authenticated using (public.current_profile_is_active());
create policy calendar_date_remarks_insert_admin on public.calendar_date_remarks for insert to authenticated with check (public.current_profile_is_admin() and updated_by = auth.uid());
create policy calendar_date_remarks_update_admin on public.calendar_date_remarks for update to authenticated using (public.current_profile_is_admin()) with check (public.current_profile_is_admin() and updated_by = auth.uid());
create policy calendar_date_remarks_delete_admin on public.calendar_date_remarks for delete to authenticated using (public.current_profile_is_admin());

create or replace function public.current_profile_can_edit_requests() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'staff'::public.app_role and can_edit_requests);
$$;

drop policy weekly_groups_insert_owner_staff on public.weekly_request_groups;
create policy weekly_groups_insert_owner_staff on public.weekly_request_groups for insert to authenticated with check (owner_id = auth.uid() and public.current_profile_can_edit_requests() and (week_start + 6) >= public.kl_today() and btrim(remark) <> '');
drop policy weekly_groups_update_owner_staff on public.weekly_request_groups;
create policy weekly_groups_update_owner_staff on public.weekly_request_groups for update to authenticated using (owner_id = auth.uid() and public.current_profile_can_edit_requests() and public.weekly_group_has_current_or_future_scope(id)) with check (owner_id = auth.uid() and public.current_profile_can_edit_requests() and (week_start + 6) >= public.kl_today() and btrim(remark) <> '');
drop policy weekly_groups_delete_owner_staff on public.weekly_request_groups;
create policy weekly_groups_delete_owner_staff on public.weekly_request_groups for delete to authenticated using (owner_id = auth.uid() and public.current_profile_can_edit_requests() and public.weekly_group_has_current_or_future_scope(id));
drop policy request_entries_insert_owner_future_staff on public.request_entries;
create policy request_entries_insert_owner_future_staff on public.request_entries for insert to authenticated with check (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_can_edit_requests() and public.weekly_group_is_mutable(group_id));
drop policy request_entries_update_owner_future_staff on public.request_entries;
create policy request_entries_update_owner_future_staff on public.request_entries for update to authenticated using (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_can_edit_requests()) with check (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_can_edit_requests() and public.weekly_group_is_mutable(group_id));
drop policy request_entries_delete_owner_future_staff on public.request_entries;
create policy request_entries_delete_owner_future_staff on public.request_entries for delete to authenticated using (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_can_edit_requests());

create or replace function public.save_weekly_requests(p_week_start date,p_remark text,p_entries jsonb,p_expected_updated_at timestamptz default null) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_owner uuid := auth.uid(); v_group_id uuid; v_current_updated_at timestamptz; v_entry jsonb; v_entry_id uuid; v_code text;
begin
 if not public.current_profile_can_edit_requests() then raise exception 'Staff request editing is locked' using errcode = '42501'; end if;
 if extract(isodow from p_week_start) <> 1 then raise exception 'Week must start on Monday' using errcode = '22023'; end if;
 if (p_week_start + 6) < public.kl_today() then raise exception 'Past weeks cannot be edited' using errcode = '42501'; end if;
 if jsonb_typeof(p_entries) <> 'array' then raise exception 'Entries must be an array' using errcode = '22023'; end if;
 if jsonb_array_length(p_entries) > 0 and btrim(p_remark) = '' then raise exception 'A weekly remark is required' using errcode = '23514'; end if;
 if exists(select 1 from jsonb_array_elements(p_entries) e where (e->>'date')::date < public.kl_today() or public.week_start_for((e->>'date')::date) <> p_week_start or jsonb_typeof(e->'codes') <> 'array' or jsonb_array_length(e->'codes') = 0) then raise exception 'Invalid or ineligible request date' using errcode = '22023'; end if;
 select id,updated_at into v_group_id,v_current_updated_at from public.weekly_request_groups where owner_id=v_owner and week_start=p_week_start for update;
 if v_group_id is not null and p_expected_updated_at is not null and v_current_updated_at <> p_expected_updated_at then raise exception 'This week changed in another session' using errcode = '40001'; end if;
 if v_group_id is null and jsonb_array_length(p_entries)>0 then insert into public.weekly_request_groups(owner_id,week_start,remark) values(v_owner,p_week_start,btrim(p_remark)) returning id into v_group_id;
 elsif v_group_id is not null and jsonb_array_length(p_entries)>0 then update public.weekly_request_groups set remark=btrim(p_remark) where id=v_group_id; end if;
 if v_group_id is not null then
  delete from public.request_entries where group_id=v_group_id and request_date>=public.kl_today();
  for v_entry in select value from jsonb_array_elements(p_entries) loop
   insert into public.request_entries(group_id,owner_id,request_date) values(v_group_id,v_owner,(v_entry->>'date')::date) returning id into v_entry_id;
   for v_code in select value #>> '{}' from jsonb_array_elements(v_entry->'codes') loop insert into public.request_entry_codes(request_entry_id,code) values(v_entry_id,v_code); end loop;
  end loop;
  if not exists(select 1 from public.request_entries where group_id=v_group_id) then delete from public.weekly_request_groups where id=v_group_id; return null; end if;
 end if;
 return v_group_id;
end; $$;

create or replace function public.weekly_group_is_mutable(group_id uuid) returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.weekly_request_groups g where g.id=group_id and g.owner_id=auth.uid() and public.current_profile_can_edit_requests());
$$;
create or replace function public.entry_is_mutable(entry_id uuid) returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.request_entries e where e.id=entry_id and e.owner_id=auth.uid() and e.request_date>=public.kl_today() and public.current_profile_can_edit_requests());
$$;
