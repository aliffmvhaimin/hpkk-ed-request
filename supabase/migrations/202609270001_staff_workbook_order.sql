alter table public.profiles add column workbook_order integer;

with source_positions as (
  select
    target_id,
    min(((regexp_match(source_ref, '[0-9]+'))[1])::integer) as source_row
  from public.import_records
  where status = 'resolved'
    and target_table = 'profiles'
    and target_id is not null
  group by target_id
), ordered_profiles as (
  select
    p.id,
    row_number() over (
      order by
        case p.role_name
          when 'JURURAWAT TERLATIH' then 1
          when 'PENOLONG PEGAWAI PERUBATAN' then 2
          when 'PEMBANTU PERAWATAN KESIHATAN' then 3
          else 4
        end,
        source_positions.source_row,
        p.display_name
    )::integer as workbook_order
  from public.profiles p
  join source_positions on source_positions.target_id = p.id
  where p.role = 'staff'
)
update public.profiles p
set workbook_order = ordered_profiles.workbook_order
from ordered_profiles
where ordered_profiles.id = p.id;

alter table public.profiles add constraint profiles_workbook_order_positive
  check (workbook_order is null or workbook_order > 0);