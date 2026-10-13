import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the application shell presents the confirmed project identity", async () => {
  const shell = await readFile(new URL("../components/app-shell.tsx", import.meta.url), "utf8");
  const project = await readFile(new URL("../lib/project.ts", import.meta.url), "utf8");

  assert.match(shell, /projectDetails\.name/);
  assert.match(project, /HPKK ED Request/);
});

test("the root route uses login as the landing page", async () => {
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(home, /redirect\("\/login"\)/);
});

test("the environment contract contains placeholders rather than values", async () => {
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const assignments = envExample
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"));

  assert.deepEqual(assignments, [
    "NEXT_PUBLIC_SUPABASE_URL=",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=",
    "SUPABASE_SERVICE_ROLE_KEY=",
    "SMOKE_STAFF_TEMP_PASSWORD=",
    "SMOKE_STAFF_CHANGED_PASSWORD=",
    "SMOKE_ADMIN_TEMP_PASSWORD=",
    "SMOKE_DISABLED_TEMP_PASSWORD=",
    "SMOKE_STAFF_B_TEMP_PASSWORD=",
  ]);
});
