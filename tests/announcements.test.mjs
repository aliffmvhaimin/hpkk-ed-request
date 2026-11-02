import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSource } from "./helpers/component-harness.mjs";

const valid = { title: " December requests ", message: " Please submit before closure. ", closureDate: "2026-11-20" };
const id = "a0000000-0000-0000-0000-000000000001";

function actions({ allowed = true, failure = false } = {}) {
  const writes = [], paths = [];
  const loaded = loadSource("lib/announcement-actions.ts", {
    "@/lib/auth/session": { requireAdminProfile: async () => {
      if (!allowed) throw new Error("Administrator access required");
      return { profile: { id: "admin" } };
    } },
    "next/cache": { revalidatePath: path => paths.push(path) },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({ from: table => ({
      insert: async row => { writes.push({ table, row }); return { error: failure ? {} : null }; },
      delete: () => ({ eq: async (column, value) => { writes.push({ table, column, value }); return { error: failure ? {} : null }; } }),
    }) }) },
  });
  return { ...loaded, writes, paths };
}

test("publishing requires admin authorization and stores a validated notice", async () => {
  const denied = actions({ allowed: false });
  await assert.rejects(denied.publishAnnouncementAction(valid), /Administrator/);
  await assert.rejects(denied.removeAnnouncementAction(id), /Administrator/);
  assert.equal(denied.writes.length, 0);
  const admin = actions();
  for (const input of [null, { ...valid, title: " " }, { ...valid, message: "x".repeat(2001) }, { ...valid, closureDate: "2026-02-30" }]) {
    assert.equal((await admin.publishAnnouncementAction(input)).ok, false);
  }
  assert.equal(admin.writes.length, 0);
  assert.equal((await admin.publishAnnouncementAction(valid)).ok, true);
  assert.deepEqual(admin.writes[0], { table: "announcements", row: { title: "December requests", message: "Please submit before closure.", closure_date: "2026-11-20", created_by: "admin" } });
  assert.deepEqual(admin.paths, ["/dashboard"]);
  assert.equal((await admin.publishAnnouncementAction({ ...valid, closureDate: "" })).ok, true);
  assert.equal(admin.writes[1].row.closure_date, null);
});

test("removal targets only the selected announcement and failed writes do not report success", async () => {
  const admin = actions();
  assert.equal((await admin.removeAnnouncementAction("invalid")).ok, false);
  assert.equal(admin.writes.length, 0);
  assert.equal((await admin.removeAnnouncementAction(id)).ok, true);
  assert.deepEqual(admin.writes, [{ table: "announcements", column: "id", value: id }]);
  const failed = actions({ failure: true });
  assert.equal((await failed.publishAnnouncementAction(valid)).ok, false);
  assert.equal((await failed.removeAnnouncementAction(id)).ok, false);
  assert.deepEqual(failed.paths, []);
});

test("staff see escaped notices and closure dates while only admins see management controls", () => {
  const { Announcements } = loadSource("components/announcements.tsx", { "@/lib/announcement-actions": {} });
  const announcements = [{ id, title: "December requests", message: "<script>alert('test')</script>\nSubmit early.", closure_date: "2026-11-20", created_at: "2026-11-01T18:00:00Z" }];
  const render = (isAdmin, notices = announcements) => renderToStaticMarkup(createElement(Announcements, { isAdmin, announcements: notices }));
  const staff = render(false);
  assert.match(staff, /Requests close on/);
  assert.match(staff, /20 November 2026/);
  assert.match(staff, /2 November 2026/); // Posted date uses Kuala Lumpur time.
  assert.match(staff, /&lt;script&gt;/);
  assert.doesNotMatch(staff, /<script>|Post an announcement|<button/);
  assert.match(render(true), /Publish announcement/);
  assert.match(render(true), /Remove announcement:/);
  assert.equal(render(false, []), "");
});

test("announcement database failures and connection exceptions leave the calendar load independent", async () => {
  for (const throws of [false, true]) {
    const { getAnnouncements } = loadSource("lib/announcement-data.ts", {
      "@/lib/supabase/server": { createSupabaseServerClient: async () => {
        if (throws) throw new Error("Connection unavailable");
        return {};
      } },
      "@/lib/supabase/pagination": { readAllRows: async () => ({ data: null, error: { code: "42P01" } }) },
    });
    const result = await getAnnouncements();
    assert.deepEqual(result.announcements, []);
    assert.match(result.loadError, /temporarily unavailable/);
    const { Announcements } = loadSource("components/announcements.tsx", { "@/lib/announcement-actions": {} });
    for (const isAdmin of [false, true]) {
      const html = renderToStaticMarkup(createElement(Announcements, { ...result, isAdmin }));
      assert.match(html, /temporarily unavailable/);
      assert.doesNotMatch(html, /No announcements yet|Publish announcement/);
    }
  }
});

test("announcement loading distinguishes an empty notice list from a service failure", async () => {
  const { getAnnouncements } = loadSource("lib/announcement-data.ts", {
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({}) },
    "@/lib/supabase/pagination": { readAllRows: async () => ({ data: [], error: null }) },
  });
  assert.deepEqual(await getAnnouncements(), { announcements: [], loadError: null });
});
