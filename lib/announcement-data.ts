import "server-only";
import type { Announcement } from "@/lib/announcements";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readAllRows } from "@/lib/supabase/pagination";

export async function getAnnouncements(): Promise<{ announcements: Announcement[]; loadError: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await readAllRows((from, to) => supabase.from("announcements")
      .select("id, title, message, closure_date, created_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id").range(from, to));
    if (!error) return { announcements: data ?? [], loadError: null };
  } catch {
    // Notices must not prevent staff from accessing the request calendar.
  }
  return { announcements: [], loadError: "Announcements are temporarily unavailable. Refresh the page to try again." };
}
