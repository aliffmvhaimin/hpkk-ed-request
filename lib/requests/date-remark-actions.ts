"use server";
import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveDateRemarkAction(input:{date:string;remark:string}) {
  const { profile } = await requireAdminProfile();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.remark.trim().length > 120) return {ok:false,message:"Enter a valid date remark (maximum 120 characters)."};
  const supabase = await createSupabaseServerClient();
  const remark=input.remark.trim();
  const result=remark
    ? await supabase.from("calendar_date_remarks").upsert({remark_date:input.date,remark,updated_by:profile.id},{onConflict:"remark_date"})
    : await supabase.from("calendar_date_remarks").delete().eq("remark_date",input.date);
  if(result.error)return {ok:false,message:"Date remark could not be saved."};
  revalidatePath("/dashboard");
  return {ok:true,message:"Saved"};
}
