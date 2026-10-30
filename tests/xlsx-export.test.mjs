import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { loadSource } from "./helpers/component-harness.mjs";

test("weekly XLSX gives the actual remark column room and merges the title across nine columns", async () => {
  let blob, clicked = false, revoked = false;
  const link = { click() { clicked = true; } };
  const { downloadXlsx } = loadSource("lib/xlsx.ts", {}, {
    document: { createElement: () => link },
    URL: { createObjectURL(value) { blob = value; return "blob:test"; }, revokeObjectURL() { revoked = true; } },
  });
  const remark = "DAFTAR ANAK SEKOLAH & <school>";
  downloadXlsx([["Weekly requests"], ["Staff", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Weekly remark"], ["Staff One", "PG", "", "", "", "", "", "", remark]], "requests.xlsx");
  const zip = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const sheet = strFromU8(zip["xl/worksheets/sheet1.xml"]);
  assert.match(sheet, /<col min="9" max="9" width="36"/);
  assert.match(sheet, /<mergeCell ref="A1:I1"/);
  assert.match(sheet, /<c r="I3" t="inlineStr"><is><t xml:space="preserve">DAFTAR ANAK SEKOLAH &amp; &lt;school&gt;/);
  assert.equal(link.download, "requests.xlsx");
  assert.equal(clicked, true);
  assert.equal(revoked, true);
});
