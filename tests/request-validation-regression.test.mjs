import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./helpers/component-harness.mjs";

const valid = {
  weekStart: "2026-11-09", remark: "School registration", expectedUpdatedAt: null,
  editableDates: ["2026-11-09"], entries: [{ date: "2026-11-09", codes: ["PG"] }],
};
function setup(rpc = async () => ({ error: null })) {
  let clients = 0;
  const mocks = {
    "@/lib/auth/session": {
      getSessionProfile: async () => ({ profile: { role: "staff", can_edit_requests: true, must_change_password: false } }),
      requireAdminProfile: async () => ({ profile: { id: "admin" } }),
    },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => { clients++; return { rpc }; } },
    "next/cache": { revalidatePath() {} },
  };
  return { mocks, clients: () => clients };
}

test("malformed weekly saves return validation feedback before opening a database client", async () => {
  const app = setup();
  const { saveWeekAction } = loadSource("lib/requests/actions.ts", app.mocks);
  for (const input of [
    null, {}, { ...valid, remark: null }, { ...valid, weekStart: "2026-02-30" },
    { ...valid, weekStart: "2026-11-10" }, { ...valid, expectedUpdatedAt: {} },
    { ...valid, editableDates: ["2026-11-09", "2026-11-09"] },
    { ...valid, editableDates: ["2026-11-16"] },
    { ...valid, entries: [null] }, { ...valid, entries: [{ date: "2026-11-09", codes: "PG" }] },
    { ...valid, entries: [{ date: "2026-11-09", codes: ["PG", "PG"] }] },
    { ...valid, entries: [{ date: "2026-11-10", codes: ["PG"] }] },
    { ...valid, entries: [{ date: "2026-11-09", codes: [null] }] },
  ]) {
    const result = await saveWeekAction(input);
    assert.equal(result.ok, false);
    assert.equal(result.kind, "validation");
  }
  assert.equal(app.clients(), 0);
});

test("valid weekly saves retain their scope and a dropped connection returns recoverable feedback", async () => {
  const calls = [];
  const app = setup(async (...args) => { calls.push(args); return { error: null }; });
  const { saveWeekAction } = loadSource("lib/requests/actions.ts", app.mocks);
  assert.deepEqual(await saveWeekAction(valid), { ok: true });
  assert.deepEqual(calls[0][1].p_editable_dates, valid.editableDates);
  assert.deepEqual(calls[0][1].p_entries, valid.entries);
  const offline = setup(async () => { throw new Error("Connection lost"); });
  const result = await loadSource("lib/requests/actions.ts", offline.mocks).saveWeekAction(valid);
  assert.equal(result.kind, "failure");
  assert.match(result.message, /could not be confirmed/);
});

test("date remark and date closure actions reject null and impossible dates", async () => {
  const app = setup();
  const { saveDateRemarkAction } = loadSource("lib/requests/date-remark-actions.ts", app.mocks);
  const { setRequestDateAccessAction } = loadSource("lib/requests/date-access-actions.ts", app.mocks);
  for (const input of [null, {}, { date: "2026-02-30", remark: "Invalid" }, { date: "2026-11-09", remark: null }]) {
    assert.equal((await saveDateRemarkAction(input)).ok, false);
  }
  assert.equal((await setRequestDateAccessAction(null)).ok, false);
  assert.equal((await setRequestDateAccessAction({ start: null, end: "2026-11-09", locked: true })).ok, false);
  assert.equal(app.clients(), 0);
});
