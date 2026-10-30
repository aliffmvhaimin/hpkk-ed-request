import assert from "node:assert/strict";
import test from "node:test";
import { createHookHarness, find, findAll, loadSource } from "./helpers/component-harness.mjs";

const dates = Array.from({ length: 7 }, (_, i) => `2026-11-${String(9 + i).padStart(2, "0")}`);
const original = { id: "group", ownerId: "staff", weekStart: dates[0], remark: "Original", updatedAt: "2026-10-30T00:00:00Z" };
const fresh = { ...original, remark: "Updated elsewhere", updatedAt: "2026-10-30T00:01:00Z" };
const entry = code => ({ id: "entry", groupId: "group", ownerId: "staff", date: dates[0], codes: [code] });

for (const mode of ["desktop", "mobile"]) {
  function setup() {
    const harness = createHookHarness(), saves = [];
    const file = mode === "desktop" ? "weekly-grid" : "week-editor";
    const loaded = loadSource(`components/calendar/${file}.tsx`, {
      react: harness.react,
      "next/navigation": { useRouter: () => ({ refresh() {} }) },
      "@/components/calendar/use-unsaved-request-changes": { useUnsavedRequestChanges() {} },
      "@/lib/requests/actions": { saveWeekAction: async input => { saves.push(input); return { ok: false, message: "Conflict" }; } },
      "@/lib/requests/date-remark-actions": {},
    });
    const component = loaded.WeeklyGrid ?? loaded.WeekEditor;
    const props = (group = original, code = "PG") => mode === "desktop"
      ? { weekStart: dates[0], dates, month: "2026-11", today: dates[0], viewerId: "staff", canEdit: true, isAdmin: false,
          staff: [{ id: "staff", displayName: "Staff", roleName: "JURURAWAT TERLATIH" }], entries: [entry(code)], groups: [group], dateRemarks: [] }
      : { weekStart: dates[0], dates, initialEntries: [entry(code)], group };
    const render = (group, code) => harness.render(component, props(group, code));
    const remark = tree => find(tree, node => mode === "desktop" ? node.props["aria-label"] === "Weekly remark" : node.type === "textarea");
    const edit = (tree, value) => mode === "desktop" ? remark(tree).props.onValueChange(value) : remark(tree).props.onChange({ target: { value } });
    const button = (tree, text) => find(tree, node => node.type === "button" && node.props.children === text);
    return { harness, saves, render, remark, edit, button };
  }

  test(`${mode}: a clean editor loads refreshed remarks and request codes`, () => {
    const app = setup();
    app.render();
    const tree = app.render(fresh, "PTG");
    assert.equal(app.remark(tree).props.value, fresh.remark);
    const inputs = findAll(tree, node => node.type === "input" && node.props.type === "checkbox");
    assert.equal(inputs[mode === "desktop" ? 1 : 0].props.checked, false);
    assert.equal(inputs[mode === "desktop" ? 2 : 1].props.checked, true);
  });

  test(`${mode}: a dirty editor preserves its draft and original conflict timestamp`, async () => {
    const app = setup();
    app.edit(app.render(), "My unsaved remark");
    const tree = app.render(fresh, "PTG");
    assert.equal(app.remark(tree).props.value, "My unsaved remark");
    app.button(tree, mode === "desktop" ? "Save" : "Save week").props.onClick();
    await app.harness.settle();
    assert.equal(app.saves[0].expectedUpdatedAt, original.updatedAt);
    assert.equal(app.saves[0].remark, "My unsaved remark");
    assert.deepEqual(app.saves[0].entries[0].codes, ["PG"]);
  });

  test(`${mode}: Cancel restores fresh server data and its conflict timestamp`, async () => {
    const app = setup();
    app.edit(app.render(), "Discard me");
    app.button(app.render(fresh, "PTG"), "Cancel").props.onClick();
    let tree = app.render(fresh, "PTG");
    assert.equal(app.remark(tree).props.value, fresh.remark);
    app.edit(tree, "New draft");
    tree = app.render(fresh, "PTG");
    app.button(tree, mode === "desktop" ? "Save" : "Save week").props.onClick();
    await app.harness.settle();
    assert.equal(app.saves[0].expectedUpdatedAt, fresh.updatedAt);
    assert.deepEqual(app.saves[0].entries[0].codes, ["PTG"]);
  });
}

test("remark input leaves typed text alone and restores text on Cancel", () => {
  const harness = createHookHarness();
  const { RemarkInput } = loadSource("components/calendar/remark-input.tsx", { react: harness.react });
  let value = "", writes = 0, text = "";
  const node = { get textContent() { return text; }, set textContent(next) { writes++; text = next; } };
  const render = () => harness.render(RemarkInput, { value, onValueChange: next => { value = next; } });
  let tree = render();
  tree.props.ref.current = node;
  harness.flushEffects();
  for (const letter of "DAFTAR ANAK SEKOLAH") {
    text += letter;
    tree.props.onInput({ currentTarget: node });
    tree = render();
    harness.flushEffects();
    assert.equal(tree.props.children, ""); // React's text child stays stable during typing.
  }
  assert.equal(value, "DAFTAR ANAK SEKOLAH");
  assert.equal(writes, 0);
  value = "Original remark";
  render(); harness.flushEffects();
  assert.equal(text, "Original remark");
  assert.equal(writes, 1);
});

test("week navigation honours discard refusal and blocks navigation while saving", () => {
  const window = new EventTarget(), document = new EventTarget();
  let allow = false, prompts = 0;
  const harness = createHookHarness();
  const { useUnsavedRequestChanges } = loadSource("components/calendar/use-unsaved-request-changes.ts", { react: harness.react }, {
    window, document, confirm: () => { prompts++; return allow; }, Element: class {},
  });
  const render = pending => { harness.render(() => { useUnsavedRequestChanges(true, pending); return null; }); harness.flushEffects(); };
  render(false);
  assert.equal(window.dispatchEvent(new Event("request-week-change", { cancelable: true })), false);
  allow = true;
  assert.equal(window.dispatchEvent(new Event("request-week-change", { cancelable: true })), true);
  render(true);
  assert.equal(window.dispatchEvent(new Event("request-week-change", { cancelable: true })), false);
  assert.equal(prompts, 2);
});

test("calendar week buttons consult the unsaved-change guard before changing the displayed week", () => {
  const window = new EventTarget(), harness = createHookHarness();
  let allow = false;
  window.addEventListener("request-week-change", event => { if (!allow) event.preventDefault(); });
  const { CalendarViews } = loadSource("components/calendar/calendar-views.tsx", { react: harness.react, "next/link": {} }, { window });
  const props = { month: "2026-11", today: "2026-11-09", viewerId: "staff", canEdit: true, isAdmin: false, staff: [], groups: [], entries: [], dateRemarks: [], lockedDates: [] };
  const render = () => harness.render(CalendarViews, props);
  const currentWeek = tree => find(tree, node => node.props.weekStart).props.weekStart;
  const nextButton = tree => find(tree, node => node.props["aria-label"] === "Next week");
  const start = currentWeek(render());
  nextButton(render()).props.onClick();
  assert.equal(currentWeek(render()), start);
  allow = true;
  nextButton(render()).props.onClick();
  assert.equal(currentWeek(render()), "2026-11-16");
});
