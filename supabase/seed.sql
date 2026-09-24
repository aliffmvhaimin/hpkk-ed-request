insert into public.request_codes (code, meaning_ms, display_order, is_active) values
  ('PG', 'pagi', 10, true),
  ('PTG', 'petang', 20, true),
  ('MLM', 'malam', 30, true),
  ('KM', 'kelepasan malam', 40, true),
  ('HK', 'hari kelepasan', 50, true),
  ('CT', 'cuti', 60, true),
  ('K', 'kursus', 70, true),
  ('HKA', 'hari kelepasan am', 80, true),
  ('HKO', 'hari kelepasan owing', 90, true)
on conflict (code) do update set
  meaning_ms = excluded.meaning_ms,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
