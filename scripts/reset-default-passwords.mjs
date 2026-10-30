import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].replace(/^(["'])(.*)\1$/, "$2");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server environment is incomplete");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
let updated = 0;
for (let offset = 0; ; offset += 500) {
  const { data, error } = await db.from("profiles").select("id").order("id").range(offset, offset + 499);
  if (error) throw error;
  for (const profile of data) {
    const auth = await db.auth.admin.updateUserById(profile.id, { password: "abcd1234" });
    if (auth.error) throw new Error(`Password update failed after ${updated} accounts: ${auth.error.message}`);
    const status = await db.from("profiles").update({ must_change_password: true }).eq("id", profile.id);
    if (status.error) throw new Error(`Password updated but first-login status failed: ${status.error.message}`);
    updated++;
  }
  if (data.length < 500) break;
}
console.log(`Reset ${updated} account passwords. Password change is required at next sign-in.`);
