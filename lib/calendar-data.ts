import "server-only";
import { getMonthRange } from "@/lib/calendar";
import type { RequestCode } from "@/lib/request-codes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export type CalendarStaff = { id: string; displayName: string; roleName: string };
export type CalendarGroup = { id: string; ownerId: string; weekStart: string; remark: string; updatedAt: string };
export type CalendarRequest = { id: string; ownerId: string; groupId: string; date: string; codes: RequestCode[] };
export type CalendarDateRemark = { date: string; remark: string; updatedAt: string };
export async function getCalendarData(month: string) {
  const supabase = await createSupabaseServerClient(); const { queryStart, queryEnd } = getMonthRange(month);
  const [profiles, groups, entries, dateRemarks] = await Promise.all([
    supabase.from("profiles").select("id, display_name, role_name").eq("is_active", true).order("display_name"),
    supabase.from("weekly_request_groups").select("id, owner_id, week_start, remark, updated_at").gte("week_start", queryStart).lte("week_start", queryEnd).order("week_start"),
    supabase.from("request_entries").select("id, owner_id, group_id, request_date, request_entry_codes(code)").gte("request_date", queryStart).lte("request_date", queryEnd).order("request_date"),
    supabase.from("calendar_date_remarks").select("remark_date, remark, updated_at").gte("remark_date", queryStart).lte("remark_date", queryEnd).order("remark_date"),
  ]);
  if (profiles.error || groups.error || entries.error || dateRemarks.error) throw new Error("Calendar data could not be loaded.");
  return { staff: (profiles.data ?? []).map(r => ({ id: r.id, displayName: r.display_name, roleName: r.role_name })), groups: (groups.data ?? []).map(r => ({ id: r.id, ownerId: r.owner_id, weekStart: r.week_start, remark: r.remark, updatedAt: r.updated_at })), entries: (entries.data ?? []).map(r => ({ id: r.id, ownerId: r.owner_id, groupId: r.group_id, date: r.request_date, codes: (r.request_entry_codes ?? []).map(c => c.code as RequestCode) })), dateRemarks: (dateRemarks.data ?? []).map(r => ({ date: r.remark_date, remark: r.remark, updatedAt: r.updated_at })) };
}
