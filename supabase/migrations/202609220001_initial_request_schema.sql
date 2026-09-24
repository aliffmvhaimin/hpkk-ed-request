create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.app_role as enum ('staff', 'admin');
create type public.import_status as enum ('pending_review', 'resolved', 'ignored');
create type public.import_target_table as enum (
  'profiles',
  'weekly_request_groups',
  'request_entries',
  'request_entry_codes'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  username_display text not null,
  display_name text not null,
  role public.app_role not null default 'staff',
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_trimmed check (username::text = btrim(username::text) and username::text <> ''),
  constraint profiles_username_display_trimmed check (username_display = btrim(username_display) and username_display <> ''),
  constraint profiles_display_name_trimmed check (display_name = btrim(display_name) and display_name <> '')
);

create table public.request_codes (
  code text primary key,
  meaning_ms text not null,
  display_order integer not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint request_codes_code_format check (code in ('PG', 'PTG', 'MLM', 'KM', 'HK', 'CT', 'K', 'HKA', 'HKO')),
  constraint request_codes_meaning_trimmed check (meaning_ms = btrim(meaning_ms) and meaning_ms <> '')
);

create table public.weekly_request_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  remark text not null,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_request_groups_owner_week_unique unique (owner_id, week_start),
  constraint weekly_request_groups_week_monday check (extract(isodow from week_start) = 1),
  constraint weekly_request_groups_remark_required check (btrim(remark) <> ''),
  constraint weekly_request_groups_source_valid check (source in ('app', 'xlsx_import'))
);

create table public.request_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.weekly_request_groups(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  request_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_entries_owner_date_unique unique (owner_id, request_date)
);

create table public.request_entry_codes (
  request_entry_id uuid not null references public.request_entries(id) on delete cascade,
  code text not null references public.request_codes(code),
  created_at timestamptz not null default now(),
  primary key (request_entry_id, code)
);

create table public.import_records (
  id uuid primary key default gen_random_uuid(),
  source_workbook text not null,
  source_sheet text not null,
  source_ref text not null,
  raw_value text,
  status public.import_status not null default 'pending_review',
  target_table public.import_target_table,
  target_id uuid,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_records_source_required check (
    btrim(source_workbook) <> '' and btrim(source_sheet) <> '' and btrim(source_ref) <> ''
  ),
  constraint import_records_resolved_target check (
    (status = 'resolved' and target_table is not null and target_id is not null)
    or (status <> 'resolved')
  )
);

create index request_entries_month_idx on public.request_entries (request_date, owner_id);
create index request_entries_group_idx on public.request_entries (group_id);
create index weekly_request_groups_week_idx on public.weekly_request_groups (week_start, owner_id);
create index import_records_status_idx on public.import_records (status, source_sheet);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger weekly_request_groups_set_updated_at
before update on public.weekly_request_groups
for each row execute function public.set_updated_at();

create trigger request_entries_set_updated_at
before update on public.request_entries
for each row execute function public.set_updated_at();

create trigger import_records_set_updated_at
before update on public.import_records
for each row execute function public.set_updated_at();

create or replace function public.kl_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Kuala_Lumpur')::date;
$$;

create or replace function public.week_start_for(value date)
returns date
language sql
immutable
as $$
  select (value - ((extract(isodow from value)::integer - 1) * interval '1 day'))::date;
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true;
$$;

create or replace function public.current_profile_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'staff'::public.app_role, false);
$$;

create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin'::public.app_role, false);
$$;

create or replace function public.weekly_group_is_mutable(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.weekly_request_groups g
    where g.id = group_id
      and g.owner_id = auth.uid()
      and public.current_profile_is_staff()
  );
$$;

create or replace function public.weekly_group_has_current_or_future_scope(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.weekly_request_groups g
    where g.id = group_id
      and (g.week_start + 6) >= public.kl_today()
  )
  or exists (
    select 1 from public.request_entries e
    where e.group_id = weekly_group_has_current_or_future_scope.group_id
      and e.request_date >= public.kl_today()
  );
$$;

create or replace function public.entry_is_mutable(entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.request_entries e
    where e.id = entry_id
      and e.owner_id = auth.uid()
      and e.request_date >= public.kl_today()
      and public.current_profile_is_staff()
  );
$$;

create or replace function public.request_entry_matches_group()
returns trigger
language plpgsql
as $$
declare
  group_owner uuid;
  group_week date;
begin
  select owner_id, week_start into group_owner, group_week
  from public.weekly_request_groups
  where id = new.group_id;

  if group_owner is null then
    raise exception 'Request entry group does not exist';
  end if;

  if new.owner_id <> group_owner then
    raise exception 'Request entry owner must match weekly group owner';
  end if;

  if public.week_start_for(new.request_date) <> group_week then
    raise exception 'Request date must be within weekly group';
  end if;

  return new;
end;
$$;

create trigger request_entries_match_group
before insert or update on public.request_entries
for each row execute function public.request_entry_matches_group();

alter table public.profiles enable row level security;
alter table public.request_codes enable row level security;
alter table public.weekly_request_groups enable row level security;
alter table public.request_entries enable row level security;
alter table public.request_entry_codes enable row level security;
alter table public.import_records enable row level security;

create policy profiles_select_active_shared on public.profiles
for select to authenticated
using (public.current_profile_is_active() and is_active = true);

create policy request_codes_select_active_shared on public.request_codes
for select to authenticated
using (public.current_profile_is_active() and is_active = true);

create policy weekly_groups_select_shared on public.weekly_request_groups
for select to authenticated
using (public.current_profile_is_active());

create policy weekly_groups_insert_owner_staff on public.weekly_request_groups
for insert to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_is_staff()
  and (week_start + 6) >= public.kl_today()
  and btrim(remark) <> ''
);

create policy weekly_groups_update_owner_staff on public.weekly_request_groups
for update to authenticated
using (
  owner_id = auth.uid()
  and public.current_profile_is_staff()
  and public.weekly_group_has_current_or_future_scope(id)
)
with check (
  owner_id = auth.uid()
  and public.current_profile_is_staff()
  and (week_start + 6) >= public.kl_today()
  and btrim(remark) <> ''
);

create policy weekly_groups_delete_owner_staff on public.weekly_request_groups
for delete to authenticated
using (
  owner_id = auth.uid()
  and public.current_profile_is_staff()
  and public.weekly_group_has_current_or_future_scope(id)
);

create policy request_entries_select_shared on public.request_entries
for select to authenticated
using (public.current_profile_is_active());

create policy request_entries_insert_owner_future_staff on public.request_entries
for insert to authenticated
with check (
  owner_id = auth.uid()
  and request_date >= public.kl_today()
  and public.current_profile_is_staff()
  and public.weekly_group_is_mutable(group_id)
);

create policy request_entries_update_owner_future_staff on public.request_entries
for update to authenticated
using (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_is_staff())
with check (
  owner_id = auth.uid()
  and request_date >= public.kl_today()
  and public.current_profile_is_staff()
  and public.weekly_group_is_mutable(group_id)
);

create policy request_entries_delete_owner_future_staff on public.request_entries
for delete to authenticated
using (owner_id = auth.uid() and request_date >= public.kl_today() and public.current_profile_is_staff());

create policy entry_codes_select_shared on public.request_entry_codes
for select to authenticated
using (public.current_profile_is_active());

create policy entry_codes_insert_owner_future_staff on public.request_entry_codes
for insert to authenticated
with check (public.entry_is_mutable(request_entry_id));

create policy entry_codes_delete_owner_future_staff on public.request_entry_codes
for delete to authenticated
using (public.entry_is_mutable(request_entry_id));

create policy import_records_select_admin on public.import_records
for select to authenticated
using (public.current_profile_is_admin());
