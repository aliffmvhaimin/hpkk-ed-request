-- Run with: supabase db query --linked --file supabase/tests/request-date-access.sql
-- All fixtures, closures and account changes are rolled back.
begin;
create temp table access_test_results(message text);
create temp table access_test_context(group_id uuid, updated_at timestamptz);
grant all on access_test_results, access_test_context to authenticated, anon;
create function pg_temp.check_access(ok boolean, message text) returns void language plpgsql as $$
begin
 if ok is distinct from true then raise exception 'FAILED: %',message; end if;
 insert into access_test_results values(message);
end; $$;
create function pg_temp.expect_access_error(statement text, expected_state text, message text) returns void language plpgsql as $$
declare caught boolean := false;
begin
 begin execute statement;
 exception when others then
  if sqlstate <> expected_state then raise exception 'FAILED: %, expected %, got %: %',message,expected_state,sqlstate,sqlerrm; end if;
  caught := true;
 end;
 perform pg_temp.check_access(caught,message);
end; $$;
create function pg_temp.save_test_week(p_week_start date,p_remark text,p_entries jsonb,p_expected_updated_at timestamptz default null,p_scope date[] default null) returns uuid language sql as $$
 select public.save_weekly_requests(p_week_start,p_remark,p_entries,p_expected_updated_at,coalesce(p_scope,array(select p_week_start+n from generate_series(0,6) n where not exists(select 1 from public.request_date_locks l where l.request_date=p_week_start+n))));
$$;
do $$ begin
 if exists(select 1 from auth.users where id in ('f0150000-0000-0000-0000-000000000001','f0150000-0000-0000-0000-000000000002','f0150000-0000-0000-0000-000000000003')) then raise exception 'Test fixture IDs already in use'; end if;
end; $$;
insert into auth.users(id,email) values
 ('f0150000-0000-0000-0000-000000000001','date-access-staff@example.test'),
 ('f0150000-0000-0000-0000-000000000002','date-access-admin@example.test'),
 ('f0150000-0000-0000-0000-000000000003','date-access-disabled@example.test');
insert into public.profiles(id,username,username_display,display_name,role,role_name,is_active,must_change_password) values
 ('f0150000-0000-0000-0000-000000000001','date.access.staff','date.access.staff','Date Access Staff','staff','JURURAWAT TERLATIH',true,false),
 ('f0150000-0000-0000-0000-000000000002','date.access.admin','date.access.admin','Date Access Admin','admin','Administrator',true,false),
 ('f0150000-0000-0000-0000-000000000003','date.access.disabled','date.access.disabled','Date Access Disabled','staff','JURURAWAT TERLATIH',false,false);
set local role authenticated;
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000002',true);
select public.set_request_date_access('2026-11-02','2026-11-22',false);
select public.set_request_date_access('2001-11-05','2001-11-11',false);
select pg_temp.expect_access_error($q$select public.set_request_date_access('2026-11-15','2026-11-02',true)$q$,'22023','Reversed ranges rejected');
select pg_temp.expect_access_error($q$select public.set_request_date_access('2026-01-01','2028-01-01',true)$q$,'22023','Oversized ranges rejected');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Admin edit','[{"date":"2026-11-09","codes":["PG"]}]')$q$,'42501','Admin cannot edit staff requests');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
select pg_temp.check_access(pg_temp.save_test_week('2001-11-05','Past but open','[{"date":"2001-11-05","codes":["PG"]}]') is not null,'Unlocked past dates accept requests');
select pg_temp.expect_access_error($q$select public.set_request_date_access('2026-11-02','2026-11-15',true)$q$,'42501','Staff cannot lock dates');
select pg_temp.expect_access_error($q$select public.set_request_date_access('2026-11-02','2026-11-15',false)$q$,'42501','Staff cannot unlock dates');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09',' ','[{"date":"2026-11-09","codes":["PG"]}]')$q$,'23514','Blank remark rejected');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Wrong week','[{"date":"2026-11-16","codes":["PG"]}]')$q$,'22023','Out-of-week dates rejected');
insert into access_test_context(group_id) select pg_temp.save_test_week('2026-11-09','Original remark','[{"date":"2026-11-09","codes":["PG","PTG"]},{"date":"2026-11-10","codes":["MLM"]},{"date":"2026-11-12","codes":["PG"]}]');
update access_test_context set updated_at=(select g.updated_at from public.weekly_request_groups g where g.id=group_id);
select pg_temp.check_access((select count(*)=4 from public.request_entry_codes c join public.request_entries e on e.id=c.request_entry_id where e.group_id=(select group_id from access_test_context)),'Multiple codes persisted');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Stale','[]','2000-01-01')$q$,'40001','Stale saves rejected');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','No version','[]')$q$,'40001','Missing version cannot overwrite a week');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000002',true);
select pg_temp.check_access(public.set_request_date_access('2026-11-02','2026-11-11',true)=10,'Inclusive range locked');
select pg_temp.check_access(public.set_request_date_access('2026-11-02','2026-11-11',true)=10,'Repeated locking is safe');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
select pg_temp.save_test_week('2026-11-09','Original remark','[{"date":"2026-11-12","codes":["PTG"]}]',(select updated_at from access_test_context));
select pg_temp.check_access((select count(*)=3 from public.request_entries where group_id=(select group_id from access_test_context)),'Partial save preserves omitted locked entries');
select pg_temp.check_access((select array_agg(c.code order by c.code)=array['PG','PTG'] from public.request_entry_codes c join public.request_entries e on e.id=c.request_entry_id where e.owner_id=auth.uid() and e.request_date='2026-11-09'),'Locked codes unchanged');
select pg_temp.check_access((select c.code='PTG' from public.request_entry_codes c join public.request_entries e on e.id=c.request_entry_id where e.owner_id=auth.uid() and e.request_date='2026-11-12'),'Open date in partial week can change');
update access_test_context set updated_at=(select g.updated_at from public.weekly_request_groups g where g.id=group_id);
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Original remark','[{"date":"2026-11-09","codes":["CT"]}]',(select updated_at from access_test_context))$q$,'22023','Locked date cannot change through RPC');
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Changed remark','[]',(select updated_at from access_test_context))$q$,'55000','Shared remark of locked entries protected');
select pg_temp.expect_access_error($q$select public.save_weekly_requests('2026-11-09','Original remark','[]',(select updated_at from access_test_context))$q$,'55000','Older browser tabs must refresh before saving');
select pg_temp.expect_access_error($q$select public.save_weekly_requests('2026-11-09','Original remark','[]',(select updated_at from access_test_context),array['2026-11-09'::date,'2026-11-12'::date])$q$,'55000','Closure after page load rejects the stale date scope');
select pg_temp.expect_access_error($q$delete from public.request_entries where owner_id=auth.uid()$q$,'42501','Direct entry deletion denied');
select pg_temp.expect_access_error($q$delete from public.weekly_request_groups where owner_id=auth.uid()$q$,'42501','Direct cascading group deletion denied');
select pg_temp.expect_access_error($q$delete from public.request_entry_codes$q$,'42501','Direct code deletion denied');
select pg_temp.save_test_week('2026-11-09','Original remark','[]',(select updated_at from access_test_context));
select pg_temp.check_access((select count(*)=2 from public.request_entries where group_id=(select group_id from access_test_context)),'Removing open requests keeps locked requests');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000002',true);
select public.set_request_date_access('2026-11-02','2026-11-15',true);
select pg_temp.check_access(exists(select 1 from public.request_date_locks where request_date='2026-11-15') and not exists(select 1 from public.request_date_locks where request_date='2026-11-16'),'2-15 November closure leaves 16 November open');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-09','Original remark','[]',(select updated_at from access_test_context))$q$,'55000','Fully locked week rejects saves');
select pg_temp.check_access(pg_temp.save_test_week('2026-11-16','Next period open','[{"date":"2026-11-16","codes":["PG"]}]') is not null,'16 November onward remains editable');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000002',true);
select public.set_request_date_access('2026-11-09','2026-11-09',false);
select public.set_request_date_access('2026-11-12','2026-11-12',false);
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
update access_test_context set updated_at=(select g.updated_at from public.weekly_request_groups g where g.id=group_id);
select public.save_weekly_requests('2026-11-09','Original remark','[{"date":"2026-11-12","codes":["PG"]}]',(select updated_at from access_test_context),array['2026-11-12'::date]);
select pg_temp.check_access((select count(*)=3 from public.request_entries where group_id=(select group_id from access_test_context)),'Saving a restricted scope preserves newly unlocked omitted dates');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000002',true);

select pg_temp.check_access(not exists(select 1 from public.request_date_locks where request_date='2026-11-09') and exists(select 1 from public.request_date_locks where request_date='2026-11-10'),'Single date unlock preserves adjacent closures');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
update access_test_context set updated_at=(select g.updated_at from public.weekly_request_groups g where g.id=group_id);
select pg_temp.save_test_week('2026-11-09','Original remark','[{"date":"2026-11-09","codes":["CT"]}]',(select updated_at from access_test_context));
select pg_temp.check_access((select c.code='CT' from public.request_entry_codes c join public.request_entries e on e.id=c.request_entry_id where e.owner_id=auth.uid() and e.request_date='2026-11-09'),'Reopened date accepts edits');
select pg_temp.expect_access_error($q$insert into public.request_date_locks(request_date,locked_by) values('2026-11-16',auth.uid())$q$,'42501','Staff cannot directly insert closures');
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000003',true);
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-16','Disabled','[]')$q$,'42501','Disabled staff cannot save');
select pg_temp.check_access((select count(*)=0 from public.request_date_locks),'Disabled staff cannot read closures');
reset role;
update public.profiles set can_edit_requests=false where id='f0150000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','f0150000-0000-0000-0000-000000000001',true);
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-16','Account locked','[]')$q$,'42501','Account locks override open dates');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.expect_access_error($q$select pg_temp.save_test_week('2026-11-16','Anonymous','[]')$q$,'42501','Anonymous users cannot save');
select pg_temp.expect_access_error($q$select public.set_request_date_access('2026-11-02','2026-11-15',false)$q$,'42501','Anonymous users cannot change closures');
reset role;
select count(*) as passed_database_checks from access_test_results;
rollback;
