"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidRequestRange } from "@/lib/request-date-access";
import { formatDay } from "@/lib/calendar";

export async function setRequestDateAccessAction(input: { start: string; end: string; locked: boolean }) {
  await requireAdminProfile();
  if (typeof input.locked !== "boolean" || !isValidRequestRange(input.start, input.end)) {
    return { ok: false, message: "Select a valid date range of up to 366 days." };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("set_request_date_access", {
      p_start: input.start, p_end: input.end, p_locked: input.locked,
    });
    if (error || typeof data !== "number") return { ok: false, message: "Date access could not be confirmed. Please try again; the operation is safe to repeat." };
    revalidatePath("/dashboard");
    const display = (date: string) => formatDay(date, { day: "numeric", month: "short", year: "numeric" });
    return { ok: true, message: `${display(input.start)} – ${display(input.end)}: ${data} dates ${input.locked ? "locked" : "unlocked"} for all staff.` };
  } catch {
    return { ok: false, message: "Date access could not be confirmed. Please try again; the operation is safe to repeat." };
  }
}
