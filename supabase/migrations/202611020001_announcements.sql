-- Announcements are shared staff notices; request access remains controlled by date locks.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  closure_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
revoke all on public.announcements from public, anon, authenticated;
grant select, insert, delete on public.announcements to authenticated;

create policy announcements_select_active on public.announcements
  for select to authenticated using (public.current_profile_is_active());
create policy announcements_insert_admin on public.announcements
  for insert to authenticated with check (public.current_profile_is_admin() and created_by = auth.uid());
create policy announcements_delete_admin on public.announcements
  for delete to authenticated using (public.current_profile_is_admin());
