import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: file,
  });
  const exports = {};
  new Function("require", "exports", outputText)(name => {
    if (name in mocks) return mocks[name];
    if (name === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (name.startsWith("@/lib/requests/")) return {};
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, mocks);
    return require(name);
  }, exports);
  return exports;
}

const { isValidRequestRange, summarizeLockedDates } = load("lib/request-date-access.ts");
const { WeeklyGrid } = load("components/calendar/weekly-grid.tsx");
const { WeekEditor } = load("components/calendar/week-editor.tsx");
const dates = Array.from({ length: 7 }, (_, i) => `2026-11-${9 + i < 10 ? "0" : ""}${9 + i}`);
const entry = { id: "entry", groupId: "group", ownerId: "staff", date: dates[0], codes: ["PG"] };
const group = { id: "group", ownerId: "staff", weekStart: dates[0], remark: "Original remark", updatedAt: "2026-10-15T00:00:00Z" };
const gridProps = { weekStart: dates[0], dates, month: "2026-11", today: "2026-11-19", viewerId: "staff", canEdit: true, isAdmin: false, staff: [{ id: "staff", displayName: "Nurse One", roleName: "JURURAWAT TERLATIH" }], entries: [entry], groups: [group], dateRemarks: [] };

test("date ranges reject reversed, impossible, and excessive dates", () => {
  assert.equal(isValidRequestRange("2026-11-02", "2026-11-15"), true);
  assert.equal(isValidRequestRange("2026-11-15", "2026-11-02"), false);
  assert.equal(isValidRequestRange("2026-02-30", "2026-03-01"), false);
  assert.equal(isValidRequestRange("2026-01-01", "2027-01-02"), false);
  assert.equal(isValidRequestRange("2028-02-29", "2028-02-29"), true);
});

test("locked-date summary joins adjacent dates across months without duplicates", () => {
  assert.deepEqual(summarizeLockedDates(["2026-11-02", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-04"]), [
    { start: "2026-10-31", end: "2026-11-02" }, { start: "2026-11-04", end: "2026-11-04" },
  ]);
});

test("desktop grid permits all seven open dates even when the entire week is in the past", () => {
  const html = renderToStaticMarkup(createElement(WeeklyGrid, { ...gridProps, lockedDates: [] }));
  assert.equal((html.match(/class="cell-editor"/g) ?? []).length, 7);
});

test("partial closure disables only closed dates and freezes a shared remark", () => {
  const html = renderToStaticMarkup(createElement(WeeklyGrid, { ...gridProps, lockedDates: dates.slice(0, 3) }));
  assert.equal((html.match(/class="cell-editor"/g) ?? []).length, 4);
  assert.match(html, /aria-readonly="true" contentEditable="false"/i);
  assert.match(html, /Original remark/);
  assert.match(html, /code-pg/);
});

test("fully closed desktop week has no staff request or remark editor", () => {
  const html = renderToStaticMarkup(createElement(WeeklyGrid, { ...gridProps, lockedDates: dates }));
  assert.doesNotMatch(html, /class="cell-editor"|class="row-remark-editor"/);
  assert.match(html, /Original remark/);
});

test("mobile editor allows past open dates while keeping locked dates and their remark read-only", () => {
  const html = renderToStaticMarkup(createElement(WeekEditor, { weekStart: dates[0], dates, lockedDates: dates.slice(0, 3), initialEntries: [entry], group }));
  assert.equal((html.match(/<fieldset disabled=""/g) ?? []).length, 3);
  assert.equal((html.match(/<fieldset>/g) ?? []).length, 4);
  assert.match(html, /<textarea disabled=""/);
});

test("date access action validates before database calls and uses the confirmed inclusive range", async () => {
  const calls = [], paths = [];
  const { setRequestDateAccessAction } = load("lib/requests/date-access-actions.ts", {
    "@/lib/auth/session": { requireAdminProfile: async () => {} },
    "next/cache": { revalidatePath: value => paths.push(value) },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({ rpc: async (name, args) => { calls.push({ name, args }); return { data: 14, error: null }; } }) },
  });
  assert.equal((await setRequestDateAccessAction({ start: "2026-11-15", end: "2026-11-02", locked: true })).ok, false);
  assert.equal(calls.length, 0);
  const result = await setRequestDateAccessAction({ start: "2026-11-02", end: "2026-11-15", locked: true });
  assert.equal(result.ok, true);
  assert.match(result.message, /14 dates locked for all staff/);
  assert.deepEqual(calls, [{ name: "set_request_date_access", args: { p_start: "2026-11-02", p_end: "2026-11-15", p_locked: true } }]);
  assert.deepEqual(paths, ["/dashboard"]);
});

test("week saves send an explicit edit scope and treat new closures as validation errors", async () => {
  const calls = [];
  const { saveWeekAction } = load("lib/requests/actions.ts", {
    "@/lib/auth/session": { getSessionProfile: async () => ({ profile: { role: "staff", must_change_password: false, can_edit_requests: true } }) },
    "next/cache": { revalidatePath() {} },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({ rpc: async (name, args) => { calls.push({ name, args }); return { error: { code: "55000" } }; } }) },
  });
  const input = { weekStart: dates[0], remark: "Original remark", expectedUpdatedAt: group.updatedAt, entries: [], editableDates: dates.slice(3) };
  const result = await saveWeekAction(input);
  assert.equal(result.ok, false);
  assert.equal(result.kind, "validation");
  assert.match(result.message, /Refresh the calendar/);
  assert.deepEqual(calls[0].args.p_editable_dates, dates.slice(3));
  calls.length = 0;
  assert.equal((await saveWeekAction({ ...input, editableDates: undefined })).ok, false);
  assert.equal(calls.length, 0);
});
