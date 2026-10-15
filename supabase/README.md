# Supabase

Apply migrations with `supabase db push --linked`. The date-access migration keeps all dates open unless an administrator explicitly closes them. No production dates are closed by this migration.

Admins manage inclusive date ranges from **View Calendar → Lock request dates**. Account edit locks remain a separate override. Past dates can be edited when their date and the staff account are both unlocked.

Staff request writes go through `save_weekly_requests`; direct inserts, updates and deletes on request tables are denied to anonymous and authenticated clients. The RPC validates ownership, access, dates and version conflicts, preserves locked entries, and protects remarks shared with locked requests. Closure and save transactions use the same advisory lock.

Run `supabase db query --linked --file supabase/tests/request-date-access.sql` for database regression checks. All fixtures, date closures and account changes are rolled back. This replaces the older direct-table RLS tests because staff now write through the validated RPC.
