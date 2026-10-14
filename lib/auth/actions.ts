"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DISABLED_ACCOUNT_ERROR, GENERIC_AUTH_ERROR, PASSWORD_CHANGE_ERROR, type AuthActionState } from "@/lib/auth/errors";
import { normalizeUsername } from "@/lib/auth/username";
import { getSessionProfile } from "@/lib/auth/session";

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { message: GENERIC_AUTH_ERROR };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, is_active")
    .eq("username", username)
    .maybeSingle<{ id: string; is_active: boolean }>();

  if (profileError || !profile) {
    return { message: GENERIC_AUTH_ERROR };
  }

  if (!profile.is_active) {
    return { message: DISABLED_ACCOUNT_ERROR };
  }

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id);
  const email = authUser.user?.email;

  if (authUserError || !email) {
    return { message: GENERIC_AUTH_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: GENERIC_AUTH_ERROR };
  }

  const destination = await getPostLoginDestination(profile.id);
  redirect(destination);
}

async function getPostLoginDestination(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("must_change_password")
    .eq("id", profileId)
    .maybeSingle<{ must_change_password: boolean }>();

  return profile?.must_change_password ? "/change-password" : "/dashboard";
}

export async function changePasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    return { message: PASSWORD_CHANGE_ERROR };
  }

  const session = await getSessionProfile();
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const supabase = await createSupabaseServerClient();

  const { error: passwordError } = await supabase.auth.updateUser({ password });

  if (passwordError) {
    return { message: PASSWORD_CHANGE_ERROR };
  }

  const admin = createSupabaseAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (profileError) {
    return { message: "Password was changed, but profile setup could not be completed." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
