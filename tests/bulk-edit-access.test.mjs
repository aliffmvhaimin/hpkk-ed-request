import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

function load(file, imports) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }, fileName: file,
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, exports);
  return exports;
}

function fixture({ denied = false, databaseError = false } = {}) {
  const requests = [];
  const client = createClient("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, options) => {
      requests.push({ url: new URL(url), ...options });
      return databaseError
        ? new Response(JSON.stringify({ message: "transaction failed", code: "23514" }), { status: 400 })
        : new Response(null, { status: 204, headers: { "content-range": "0-79/80" } });
    } },
  });
  const service = load("lib/auth/admin-accounts.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => client },
    "@/lib/auth/session": { requireAdminProfile: async () => { if (denied) throw new Error("Forbidden"); } },
    "@/lib/auth/username": {}, "@/lib/staff-roles": {},
  });
  return { service, requests };
}

test("bulk lock and unlock each send one update for all staff, independent of directory filters", async () => {
  for (const canEdit of [false, true]) {
    const { service, requests } = fixture();
    assert.equal(await service.setAllStaffRequestEditing(canEdit), 80);
    assert.equal(requests.length, 1);
    const request = requests[0];
    assert.equal(request.method, "PATCH");
    assert.equal(request.url.pathname, "/rest/v1/profiles");
    assert.deepEqual([...request.url.searchParams], [["role", "eq.staff"]]);
    assert.deepEqual(JSON.parse(request.body), { can_edit_requests: canEdit });
    assert.match(new Headers(request.headers).get("prefer"), /count=exact/);
  }
});

test("bulk access rejects unauthorized or invalid requests before touching the database", async () => {
  const denied = fixture({ denied: true });
  await assert.rejects(denied.service.setAllStaffRequestEditing(false), /Forbidden/);
  assert.equal(denied.requests.length, 0);
  const invalid = fixture();
  await assert.rejects(invalid.service.setAllStaffRequestEditing("false"), /valid edit access/);
  assert.equal(invalid.requests.length, 0);
});

test("a failed bulk update reports an error without retrying individual staff", async () => {
  const { service, requests } = fixture({ databaseError: true });
  await assert.rejects(service.setAllStaffRequestEditing(false), /could not be changed/);
  assert.equal(requests.length, 1);
});

test("bulk action reports confirmed counts and refreshes the directory and dashboard only after success", async () => {
  for (const failed of [false, true]) {
    const paths = [];
    const actions = load("lib/auth/admin-actions.ts", {
      "node:crypto": {},
      "next/cache": { revalidatePath: path => paths.push(path) },
      "@/lib/auth/session": { requireAdminProfile: async () => {} },
      "@/lib/auth/admin-accounts": { setAllStaffRequestEditing: async () => {
        if (failed) throw new Error("Update failed");
        return 80;
      } },
    });
    const result = await actions.toggleAllEditAccessAction(false);
    assert.equal(result.ok, !failed);
    assert.equal(result.message, failed ? "Update failed" : "Request editing locked for all 80 staff accounts.");
    assert.deepEqual(paths, failed ? [] : ["/admin", "/dashboard"]);
  }
});
