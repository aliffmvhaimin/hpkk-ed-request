"use server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_CODES } from "@/lib/request-codes";
import { addDays, parseIsoDate } from "@/lib/calendar";
import { isValidRequestDate } from "@/lib/request-date-access";
const validCodes = new Set<string>(REQUEST_CODES.map(item => item.code));
export type SaveWeekInput = { weekStart: string; remark: string; expectedUpdatedAt: string | null; editableDates: string[]; entries: { date: string; codes: string[] }[] };
export type SaveWeekResult = { ok: true } | { ok: false; kind: "validation"|"conflict"|"session"|"failure"; message: string };
export async function saveWeekAction(input: SaveWeekInput): Promise<SaveWeekResult> {
  const session = await getSessionProfile();
  if (!session || session.profile.must_change_password) return { ok:false, kind:"session", message:"Your session expired. Sign in again before saving." };
  if (session.profile.role !== "staff") return { ok:false, kind:"validation", message:"Administrator accounts cannot edit requests." };
  if (!session.profile.can_edit_requests) return { ok:false, kind:"validation", message:"Your request editing access is locked. Contact an administrator." };
  if (!input || typeof input.remark !== "string" || !isValidRequestDate(input.weekStart) || parseIsoDate(input.weekStart).getUTCDay() !== 1 || !Array.isArray(input.entries) || input.entries.length > 7 || (input.expectedUpdatedAt !== null && (typeof input.expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(input.expectedUpdatedAt))))) return { ok:false,kind:"validation",message:"The request data is invalid." };
  if (!Array.isArray(input.editableDates) || !input.editableDates.length || input.editableDates.length > 7 || new Set(input.editableDates).size !== input.editableDates.length || input.editableDates.some(date=>!isValidRequestDate(date) || date < input.weekStart || date > addDays(input.weekStart,6))) return { ok:false,kind:"validation",message:"Refresh the calendar before saving this week." };
  const seen = new Set<string>();
  for (const entry of input.entries) { if (!entry || !isValidRequestDate(entry.date) || !input.editableDates.includes(entry.date) || seen.has(entry.date) || !Array.isArray(entry.codes) || !entry.codes.length || entry.codes.length > validCodes.size || new Set(entry.codes).size !== entry.codes.length || entry.codes.some(code=>typeof code !== "string" || !validCodes.has(code))) return { ok:false,kind:"validation",message:"Choose one or more valid codes for each unique date." }; seen.add(entry.date); }
  if (input.entries.length && !input.remark.trim()) return { ok:false,kind:"validation",message:"A weekly remark is required when the week has requests." };
  try {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("save_weekly_requests", { p_week_start:input.weekStart, p_remark:input.remark, p_entries:input.entries, p_expected_updated_at:input.expectedUpdatedAt, p_editable_dates:input.editableDates });
  if (error) { if (error.code === "55000") return { ok:false,kind:"validation",message:"Dates or their shared weekly remark are locked. Refresh the calendar before trying again." }; if (error.code === "40001") return { ok:false,kind:"conflict",message:"This week changed in another session. Refresh before trying again." }; if (error.code === "42501") return { ok:false,kind:"session",message:"Your session expired or this week is not editable." }; return { ok:false,kind:"failure",message:"The week could not be saved. Your previous data is unchanged." }; }
  revalidatePath("/dashboard"); return { ok:true };
  } catch {
    return { ok:false,kind:"failure",message:"The save could not be confirmed. Refresh the calendar before trying again." };
  }
}
