import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const modules = new Map();
function load(relativePath) {
  if (modules.has(relativePath)) return modules.get(relativePath);
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: relativePath,
  });
  const exports = {};
  const imports = (name) => {
    if (name === "next/navigation") return { useRouter: () => ({ refresh() {} }) };
    if (name === "@/lib/requests/actions" || name === "@/lib/requests/date-remark-actions") return {};
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
    return require(name);
  };
  new Function("require", "exports", outputText)(imports, exports);
  modules.set(relativePath, exports);
  return exports;
}

const { WeeklyGrid } = load("components/calendar/weekly-grid.tsx");
const { getCalendarWeeks } = load("lib/calendar.ts");
const dates = getCalendarWeeks("2026-10")[1].dates;
const props = {
  weekStart: dates[0], dates, month: "2026-10", today: dates[0],
  viewerId: "viewer", staff: [], entries: [], groups: [], dateRemarks: [],
};

test("admin calendar renders print and XLSX actions", () => {
  const html = renderToStaticMarkup(createElement(WeeklyGrid, { ...props, isAdmin: true, canEdit: false }));
  assert.match(html, /Print \/ Save PDF/);
  assert.match(html, /Export XLSX/);
});

test("staff calendar omits export actions whether editing is enabled or locked", () => {
  for (const canEdit of [true, false]) {
    const html = renderToStaticMarkup(createElement(WeeklyGrid, { ...props, isAdmin: false, canEdit }));
    assert.doesNotMatch(html, /week-export-actions|Print \/ Save PDF|Export XLSX/);
    assert.match(html, /Weekly staff request schedule/);
  }
});
