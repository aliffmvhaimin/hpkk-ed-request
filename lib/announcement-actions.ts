"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateAnnouncement } from "@/lib/announcements";

export async function publishAnnouncementAction(input: { title: string; message: string; closureDate: string }) {
  const { profile } = await requireAdminProfile();
  const announcement = validateAnnouncement(input);
  if (!announcement) return { ok: false, message: "Enter a title (up to 100 characters), message (up to 2,000 characters), and a valid optional closure date." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("announcements").insert({ ...announcement, created_by: profile.id });
    if (error) return { ok: false, message: "Announcement could not be published. Please try again." };
  } catch {
    return { ok: false, message: "Announcement could not be published. Please try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true, message: "Announcement published for all staff." };
}

export async function removeAnnouncementAction(id: string) {
  await requireAdminProfile();
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { ok: false, message: "Select a valid announcement." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return { ok: false, message: "Announcement could not be removed. Please try again." };
  } catch {
    return { ok: false, message: "Announcement could not be removed. Please try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true, message: "Announcement removed." };
}
