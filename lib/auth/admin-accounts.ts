"use server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/auth/session";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/lib/auth/username";
import { isStaffRoleName } from "@/lib/staff-roles";

export type CreateStaffAccountInput = { username:string; displayName:string; roleName:string; temporaryPassword:string; role?:"staff"|"admin" };

export async function createStaffAccount(input:CreateStaffAccountInput){
 await requireAdminProfile();
 const username=normalizeUsername(input.username),displayName=input.displayName.trim(),role=input.role??"staff",roleName=role==="admin"?"Administrator":input.roleName.trim();
 if(!isValidUsername(username)||!displayName||input.temporaryPassword.length<12||(role==="staff"&&!isStaffRoleName(roleName)))throw new Error("Invalid account details");
 const supabase=createSupabaseAdminClient(),existing=await supabase.from("profiles").select("id").eq("username",username).maybeSingle();if(existing.data)throw new Error("That username is already in use");
 const{data,error}=await supabase.auth.admin.createUser({email:usernameToAuthEmail(username),password:input.temporaryPassword,email_confirm:true});if(error||!data.user)throw new Error("Account could not be created");
 const{error:profileError}=await supabase.from("profiles").insert({id:data.user.id,username,username_display:username,display_name:displayName,role,role_name:roleName,must_change_password:true,is_active:true,can_edit_requests:true});if(profileError){await supabase.auth.admin.deleteUser(data.user.id);throw new Error("Profile could not be created")}
 return{id:data.user.id,username};
}
export async function setAccountActive(userId:string,isActive:boolean){const{profile}=await requireAdminProfile();if(profile.id===userId&&!isActive)throw new Error("You cannot disable your own account");const supabase=createSupabaseAdminClient();const{error}=await supabase.from("profiles").update({is_active:isActive}).eq("id",userId);if(error)throw new Error("Account status could not be updated")}
export async function setRequestEditing(userId:string,canEdit:boolean){await requireAdminProfile();const supabase=createSupabaseAdminClient();const{error}=await supabase.from("profiles").update({can_edit_requests:canEdit}).eq("id",userId).eq("role","staff");if(error)throw new Error("Edit access could not be changed")}
export async function updateRoleName(userId:string,roleName:string){await requireAdminProfile();const value=roleName.trim();if(!isStaffRoleName(value))throw new Error("Select a valid staff role");const supabase=createSupabaseAdminClient(),profile=await supabase.from("profiles").select("role").eq("id",userId).maybeSingle<{role:"staff"|"admin"}>();if(profile.error||profile.data?.role!=="staff")throw new Error("Only staff role names can be changed");const{error}=await supabase.from("profiles").update({role_name:value}).eq("id",userId).eq("role","staff");if(error)throw new Error("Role name could not be updated")}
export async function resetAccountPassword(userId:string,temporaryPassword:string){await requireAdminProfile();if(temporaryPassword.length<12)throw new Error("Temporary password is too short");const supabase=createSupabaseAdminClient();const{error:authError}=await supabase.auth.admin.updateUserById(userId,{password:temporaryPassword});if(authError)throw new Error("Password could not be reset");const{error:profileError}=await supabase.from("profiles").update({must_change_password:true}).eq("id",userId);if(profileError)throw new Error("Password was reset, but profile status could not be updated")}