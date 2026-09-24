import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/202609220001_initial_request_schema.sql",
  "utf8",
);
const seed = readFileSync("supabase/seed.sql", "utf8");

const expectedCodes = [
  ["PG", "pagi"],
  ["PTG", "petang"],
  ["MLM", "malam"],
  ["KM", "kelepasan malam"],
  ["HK", "hari kelepasan"],
  ["CT", "cuti"],
  ["K", "kursus"],
  ["HKA", "hari kelepasan am"],
  ["HKO", "hari kelepasan owing"],
];

test("migration creates the request data model", () => {
  for (const table of [
    "profiles",
    "request_codes",
    "weekly_request_groups",
    "request_entries",
    "request_entry_codes",
    "import_records",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("seed keeps the fixed request code meanings in Malay", () => {
  for (const [code, meaning] of expectedCodes) {
    assert.match(seed, new RegExp(`'${code}', '${meaning}'`));
  }
});

test("constraints cover remarks, uniqueness, dates, and code validity", () => {
  assert.match(migration, /weekly_request_groups_remark_required/);
  assert.match(migration, /btrim\(remark\) <> ''/);
  assert.match(migration, /request_entries_owner_date_unique unique \(owner_id, request_date\)/);
  assert.match(migration, /request_codes_code_format/);
  assert.match(migration, /request_entry_matches_group/);
  assert.match(migration, /Asia\/Kuala_Lumpur/);
});

test("RLS policies prove shared reads and owner-only staff mutations", () => {
  for (const policy of [
    "profiles_select_active_shared",
    "weekly_groups_insert_owner_staff",
    "request_entries_insert_owner_future_staff",
    "request_entries_update_owner_future_staff",
    "request_entries_delete_owner_future_staff",
    "entry_codes_insert_owner_future_staff",
    "import_records_select_admin",
  ]) {
    assert.match(migration, new RegExp(`create policy ${policy}`));
  }

  assert.match(migration, /public\.current_profile_is_staff\(\)/);
  assert.match(migration, /owner_id = auth\.uid\(\)/);
  assert.match(migration, /request_date >= public\.kl_today\(\)/);
  assert.match(migration, /weekly_group_has_current_or_future_scope/);
  assert.match(migration, /\(week_start \+ 6\) >= public\.kl_today\(\)/);
});
