import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadLocalEnv() {
  const env = readFileSync(".env.local", "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...parts] = trimmed.split("=");
    process.env[key] ??= parts.join("=");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function authEmail(username) {
  return `${username.trim().toLowerCase()}@hpkk-ed-request.local`;
}

async function ensureUser(admin, username, displayName, role, password, isActive = true) {
  const email = authEmail(username);

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfile?.id) {
    await admin.auth.admin.deleteUser(existingProfile.id);
  }

  const { data: userResult, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userResult.user) {
    throw userError ?? new Error(`Could not create ${username}`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userResult.user.id,
    username,
    username_display: username,
    display_name: displayName,
    role,
    must_change_password: true,
    is_active: isActive,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userResult.user.id);
    throw profileError;
  }

  return userResult.user;
}

async function main() {
  loadLocalEnv();

  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const staffPassword = required("SMOKE_STAFF_TEMP_PASSWORD");
  const adminPassword = required("SMOKE_ADMIN_TEMP_PASSWORD");
  const disabledPassword = required("SMOKE_DISABLED_TEMP_PASSWORD");
  const changedStaffPassword = required("SMOKE_STAFF_CHANGED_PASSWORD");

  const staff = await ensureUser(admin, "wc03.staff", "Work Card Staff", "staff", staffPassword);
  await ensureUser(admin, "wc03.admin", "Work Card Admin", "admin", adminPassword);
  await ensureUser(admin, "wc03.disabled", "Work Card Disabled", "staff", disabledPassword, false);

  const duplicate = await admin.from("profiles").insert({
    id: staff.id,
    username: "WC03.STAFF",
    username_display: "WC03.STAFF",
    display_name: "Duplicate Staff",
    role: "staff",
  });
  if (!duplicate.error) {
    throw new Error("Duplicate normalized username was accepted");
  }

  const wrongPassword = await client.auth.signInWithPassword({
    email: authEmail("wc03.staff"),
    password: "wrong-password",
  });
  if (!wrongPassword.error) {
    throw new Error("Wrong password was accepted");
  }

  const staffLogin = await client.auth.signInWithPassword({
    email: authEmail("wc03.staff"),
    password: staffPassword,
  });
  if (staffLogin.error || !staffLogin.data.user) {
    throw staffLogin.error ?? new Error("Staff login failed");
  }

  const { data: tempProfile } = await admin
    .from("profiles")
    .select("must_change_password, is_active")
    .eq("id", staffLogin.data.user.id)
    .single();
  if (!tempProfile?.must_change_password || !tempProfile.is_active) {
    throw new Error("Temporary-password gate is not set for staff");
  }

  const passwordChange = await client.auth.updateUser({ password: changedStaffPassword });
  if (passwordChange.error) {
    throw passwordChange.error;
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", staffLogin.data.user.id);
  if (profileUpdateError) {
    throw profileUpdateError;
  }

  const { data: disabledProfile } = await admin
    .from("profiles")
    .select("is_active")
    .eq("username", "wc03.disabled")
    .single();
  if (disabledProfile?.is_active) {
    throw new Error("Disabled proof profile is active");
  }

  await client.auth.signOut();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (session) {
    throw new Error("Sign out left a usable session");
  }

  console.log("Work Card 03 auth smoke passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
