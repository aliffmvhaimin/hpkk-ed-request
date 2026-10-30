import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./helpers/component-harness.mjs";

const { readAllRows } = loadSource("lib/supabase/pagination.ts");

test("pagination loads more than 1,000 requests even with a smaller server response limit", async () => {
  const rows = Array.from({ length: 1255 }, (_, id) => ({ id })), offsets = [];
  const result = await readAllRows(async (from, to) => {
    offsets.push(from);
    return { data: rows.slice(from, Math.min(to + 1, from + 100)), error: null, count: rows.length };
  });
  assert.deepEqual(result.data, rows);
  assert.deepEqual(offsets, Array.from({ length: 13 }, (_, i) => i * 100));
});

test("pagination returns an error instead of showing an incomplete roster", async () => {
  for (const fail of [true, false]) {
    const result = await readAllRows(async from => from === 0
      ? { data: [{ id: 1 }], error: null, count: 2 }
      : { data: [], error: fail ? new Error("Database unavailable") : null, count: 2 });
    assert.equal(result.data, null);
    assert.ok(result.error);
  }
});

test("calendar data includes every page of monthly request entries", async () => {
  const requests = Array.from({ length: 1255 }, (_, id) => ({ id: String(id), owner_id: "staff", group_id: "group", request_date: "2026-11-09", request_entry_codes: [{ code: "PG" }] }));
  const collections = { profiles: [], weekly_request_groups: [], calendar_date_remarks: [], request_date_locks: [], request_entries: requests };
  const ordering = [], ranges = [];
  const supabase = { from(table) {
    let from = 0, to = 999, count = false;
    const query = {
      select(_columns, options) { count = options?.count === "exact"; return query; },
      eq() { return query; }, in() { return query; }, gte() { return query; }, lte() { return query; },
      order(column) { if (table === "request_entries") ordering.push(column); return query; },
      range(start, end) { from = start; to = end; ranges.push([start, end]); return query; },
      then(resolve, reject) { return Promise.resolve({ data: collections[table].slice(from, to + 1), error: null, count: count ? collections[table].length : null }).then(resolve, reject); },
    };
    return query;
  } };
  const { getCalendarData } = loadSource("lib/calendar-data.ts", {
    "@/lib/supabase/server": { createSupabaseServerClient: async () => supabase },
  });
  const result = await getCalendarData("2026-11");
  assert.equal(result.entries.length, requests.length);
  assert.equal(new Set(result.entries.map(entry => entry.id)).size, requests.length);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
  assert.deepEqual(ordering, ["request_date", "id", "request_date", "id", "request_date", "id"]);
});
