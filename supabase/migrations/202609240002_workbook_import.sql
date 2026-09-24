alter table public.import_records add column source_hash text;
create unique index import_records_source_cell_unique on public.import_records(source_workbook,source_sheet,source_ref);

create or replace function public.apply_workbook_import(p_source_workbook text,p_source_hash text,p_groups jsonb,p_records jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare g jsonb;e jsonb;r jsonb;gid uuid;eid uuid;old_hash text;ng integer:=0;ne integer:=0;nr integer:=0;
begin
 if coalesce(btrim(p_source_workbook),'')='' or p_source_hash !~ '^[0-9a-f]{64}$' then raise exception 'Workbook identity is invalid' using errcode='22023'; end if;
 if jsonb_typeof(p_groups)<>'array' or jsonb_typeof(p_records)<>'array' then raise exception 'Import payloads must be arrays' using errcode='22023'; end if;
 select source_hash into old_hash from public.import_records where source_workbook=p_source_workbook limit 1;
 if old_hash is not null then
  if old_hash<>p_source_hash then raise exception 'This workbook name was already imported with a different file hash' using errcode='23505'; end if;
  return jsonb_build_object('status','already_applied','source_hash',p_source_hash);
 end if;
 for g in select value from jsonb_array_elements(p_groups) loop
  if exists(select 1 from public.weekly_request_groups where owner_id=(g->>'owner_id')::uuid and week_start=(g->>'week_start')::date) then raise exception 'A target staff week now exists; rerun dry-run' using errcode='23505'; end if;
  insert into public.weekly_request_groups(owner_id,week_start,remark,source) values((g->>'owner_id')::uuid,(g->>'week_start')::date,btrim(g->>'remark'),'xlsx_import') returning id into gid;ng:=ng+1;
  insert into public.import_records(source_workbook,source_hash,source_sheet,source_ref,raw_value,status,target_table,target_id,review_note) values(p_source_workbook,p_source_hash,g->>'source_sheet',g->>'remark_source_ref',g->>'remark_raw_value','resolved','weekly_request_groups',gid,'weekly remark mapped');nr:=nr+1;
  for e in select value from jsonb_array_elements(g->'entries') loop
   insert into public.request_entries(group_id,owner_id,request_date) values(gid,(g->>'owner_id')::uuid,(e->>'request_date')::date) returning id into eid;
   insert into public.request_entry_codes(request_entry_id,code) values(eid,e->>'code');
   insert into public.import_records(source_workbook,source_hash,source_sheet,source_ref,raw_value,status,target_table,target_id,review_note) values(p_source_workbook,p_source_hash,e->>'source_sheet',e->>'source_ref',e->>'raw_value','resolved','request_entries',eid,'exact request mapped');ne:=ne+1;nr:=nr+1;
  end loop;
 end loop;
 for r in select value from jsonb_array_elements(p_records) loop
  insert into public.import_records(source_workbook,source_hash,source_sheet,source_ref,raw_value,status,target_table,target_id,review_note) values(p_source_workbook,p_source_hash,r->>'source_sheet',r->>'source_ref',r->>'raw_value',(r->>'status')::public.import_status,case when r->>'target_table' is null then null else (r->>'target_table')::public.import_target_table end,case when r->>'target_id' is null then null else (r->>'target_id')::uuid end,r->>'review_note');nr:=nr+1;
 end loop;
 return jsonb_build_object('status','applied','source_hash',p_source_hash,'groups',ng,'entries',ne,'records',nr);
end;$$;
revoke all on function public.apply_workbook_import(text,text,jsonb,jsonb) from public;
grant execute on function public.apply_workbook_import(text,text,jsonb,jsonb) to service_role;
