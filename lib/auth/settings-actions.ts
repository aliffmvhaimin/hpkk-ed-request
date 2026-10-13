"use server";
import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidUsername,normalizeUsername,usernameToAuthEmail } from "@/lib/auth/username";

export type UsernameSettingsState={ok?:boolean;message?:string};
export async function updateUsernameAction(_state:UsernameSettingsState,formData:FormData):Promise<UsernameSettingsState>{
 const{profile}=await requireActiveProfile(),username=normalizeUsername(String(formData.get("username")??""));
 if(!isValidUsername(username))return{ok:false,message:"Use 3–64 lowercase letters, numbers, dots, hyphens, or underscores."};
 if(username===profile.username)return{ok:true,message:"Username is unchanged."};
 const admin=createSupabaseAdminClient(),existing=await admin.from("profiles").select("id").eq("username",username).maybeSingle<{id:string}>();
 if(existing.error)return{ok:false,message:"Username could not be checked."};
 if(existing.data&&existing.data.id!==profile.id)return{ok:false,message:"That username is already in use."};
 const authUpdate=await admin.auth.admin.updateUserById(profile.id,{email:usernameToAuthEmail(username),email_confirm:true});
 if(authUpdate.error)return{ok:false,message:"Username could not be changed."};
 const profileUpdate=await admin.from("profiles").update({username,username_display:username}).eq("id",profile.id).eq("username",profile.username).select("id").maybeSingle<{id:string}>();
 if(profileUpdate.error||!profileUpdate.data){await admin.auth.admin.updateUserById(profile.id,{email:usernameToAuthEmail(profile.username),email_confirm:true});return{ok:false,message:"Username could not be changed."}}
 revalidatePath("/settings");revalidatePath("/dashboard");revalidatePath("/admin");
 return{ok:true,message:"Username updated. Use the new username the next time you sign in."};
}