import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

type AuthenticatedProfile = Profile & {
  role: "staff" | "admin";
};

export async function getSessionProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, username_display, display_name, role, role_name, must_change_password, is_active, can_edit_requests, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<AuthenticatedProfile>();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return null;
  }

  return { user, profile };
}

export async function requireActiveProfile() {
  const session = await getSessionProfile();

  if (!session) {
    redirect("/login");
  }

  if (session.profile.must_change_password) {
    redirect("/change-password");
  }

  return session;
}

export async function requirePasswordChangeProfile() {
  const session = await getSessionProfile();

  if (!session) {
    redirect("/login");
  }

  if (!session.profile.must_change_password) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireAdminProfile() {
  const session = await requireActiveProfile();

  if (session.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return session;
}
