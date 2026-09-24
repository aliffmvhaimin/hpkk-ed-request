-- Run against a disposable Supabase database after applying migrations and seed.sql.
-- Requires pgTAP, which is available in Supabase local projects and cloud projects.

begin;

create extension if not exists pgtap with schema extensions;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as
  select role from public.profiles
  where id = auth.uid() and is_active = true;
;

create or replace function public.current_profile_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as
  select coalesce(public.current_profile_role() = 'staff'::public.app_role, false);
;

create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as
  select coalesce(public.current_profile_role() = 'admin'::public.app_role, false);
;

create temp table if not exists tap_results (line text);
truncate tap_results;
grant all on tap_results to public, authenticated, anon;

insert into tap_results select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'staff-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff-b@example.test'),
  ('00000000-0000-0000-0000-0000000000c3', 'disabled@example.test'),
  ('00000000-0000-0000-0000-0000000000d4', 'admin@example.test')
on conflict (id) do nothing;

insert into public.profiles (id, username, username_display, display_name, role, is_active) values
  ('00000000-0000-0000-0000-0000000000a1', 'staff.a', 'staff.a', 'Staff A', 'staff', true),
  ('00000000-0000-0000-0000-0000000000b2', 'staff.b', 'staff.b', 'Staff B', 'staff', true),
  ('00000000-0000-0000-0000-0000000000c3', 'disabled', 'disabled', 'Disabled Staff', 'staff', false),
  ('00000000-0000-0000-0000-0000000000d4', 'admin', 'admin', 'Admin', 'admin', true)
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

insert into tap_results select lives_ok(
  insert into public.weekly_request_groups (id, owner_id, week_start, remark)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', public.week_start_for(public.kl_today()), 'Family arrangement')
, 'Staff A can create own non-blank weekly remark');

insert into tap_results select throws_ok(
  insert into public.weekly_request_groups (owner_id, week_start, remark)
  values ('00000000-0000-0000-0000-0000000000a1', public.week_start_for(public.kl_today() + 7), '   ')
, null, null, 'Blank remarks are rejected');

insert into tap_results select lives_ok(
  insert into public.request_entries (id, group_id, owner_id, request_date)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', public.kl_today())
, 'Staff A can create own current/future entry');

insert into tap_results select lives_ok(
  insert into public.request_entry_codes (request_entry_id, code)
  values ('20000000-0000-0000-0000-000000000001', 'PG'), ('20000000-0000-0000-0000-000000000001', 'PTG')
, 'Staff A can attach multiple valid codes');

insert into tap_results select throws_ok(
  insert into public.request_entry_codes (request_entry_id, code)
  values ('20000000-0000-0000-0000-000000000001', 'BAD')
, null, null, 'Unknown codes are rejected');

insert into tap_results select throws_ok(
  insert into public.request_entries (group_id, owner_id, request_date)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', public.kl_today())
, null, null, 'Duplicate staff/date entries are rejected');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);

insert into tap_results select is_empty(
  update public.weekly_request_groups
  set remark = 'Changed by Staff B'
  where id = '10000000-0000-0000-0000-000000000001'
  returning id
, 'Staff B cannot update Staff A weekly remark');

insert into tap_results select is_empty(
  delete from public.request_entries
  where id = '20000000-0000-0000-0000-000000000001'
  returning id
, 'Staff B cannot delete Staff A entry');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d4', true);

insert into tap_results select is_empty(
  update public.weekly_request_groups
  set remark = 'Changed by Admin'
  where id = '10000000-0000-0000-0000-000000000001'
  returning id
, 'Admin cannot update request content');

insert into tap_results select throws_ok(
  insert into public.weekly_request_groups (owner_id, week_start, remark)
  values ('00000000-0000-0000-0000-0000000000d4', public.week_start_for(public.kl_today() + 7), 'Admin request')
, null, null, 'Admin cannot create request content');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);

insert into tap_results select throws_ok(
  insert into public.weekly_request_groups (owner_id, week_start, remark)
  values ('00000000-0000-0000-0000-0000000000c3', public.week_start_for(public.kl_today() + 7), 'Disabled request')
, null, null, 'Disabled staff cannot create request content');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
insert into tap_results select is((select count(*)::integer from public.request_codes), 0, 'Anonymous users cannot read request codes through RLS');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into tap_results select ok((select count(*) from public.request_codes) = 9, 'Active staff can read seeded codes');
insert into tap_results select ok((select count(*) from public.weekly_request_groups) >= 1, 'Active staff can read shared remarks');

reset role;
insert into public.weekly_request_groups (id, owner_id, week_start, remark)
values ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', public.week_start_for(public.kl_today() - 14), 'Historical imported request');
insert into public.request_entries (id, group_id, owner_id, request_date)
values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', public.kl_today() - 14);
set local role authenticated;

insert into tap_results select is_empty(
  update public.request_entries
  set request_date = public.kl_today()
  where id = '20000000-0000-0000-0000-000000000002'
  returning id
, 'Past entries are immutable');

insert into tap_results select isnt_empty(
  update public.weekly_request_groups
  set remark = 'Updated owner remark'
  where id = '10000000-0000-0000-0000-000000000001'
  returning id
, 'Owner staff can update own remark');

insert into tap_results select throws_ok(
  update public.request_entries
  set owner_id = '00000000-0000-0000-0000-0000000000b2'
  where id = '20000000-0000-0000-0000-000000000001'
  returning id
, null, null, 'Owner cannot move entry to another staff member');

insert into tap_results select isnt_empty(
  delete from public.request_entry_codes
  where request_entry_id = '20000000-0000-0000-0000-000000000001'
  returning request_entry_id
, 'Owner can delete own future code selections');

insert into tap_results select * from finish();

select * from tap_results;

rollback;
