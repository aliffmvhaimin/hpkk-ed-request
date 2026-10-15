"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createStaffAccount, resetAccountPassword, setAccountActive, setRequestEditing, setAllStaffRequestEditing, updateRoleName } from "@/lib/auth/admin-accounts";
import { requireAdminProfile } from "@/lib/auth/session";
export type AdminActionResult={ok:boolean;message:string;temporaryPassword?:string};
function temporaryPassword(){return `Hpkk!${randomBytes(9).toString("base64url")}`}
export async function createAccountAction(input:{username:string;displayName:string;roleName:string;role:"staff"|"admin"}):Promise<AdminActionResult>{await requireAdminProfile();const password=temporaryPassword();try{await createStaffAccount({...input,temporaryPassword:password});revalidatePath("/admin");return{ok:true,message:"Account created. Copy the temporary password now; it will not be shown again.",temporaryPassword:password}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Account could not be created"}}}
export async function toggleAccountAction(userId:string,isActive:boolean):Promise<AdminActionResult>{await requireAdminProfile();try{await setAccountActive(userId,isActive);revalidatePath("/admin");return{ok:true,message:isActive?"Account enabled.":"Account disabled."}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Status could not be changed"}}}
export async function toggleEditAccessAction(userId:string,canEdit:boolean):Promise<AdminActionResult>{await requireAdminProfile();try{await setRequestEditing(userId,canEdit);revalidatePath("/admin");revalidatePath("/dashboard");return{ok:true,message:canEdit?"Staff editing unlocked.":"Staff editing locked."}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Edit access could not be changed"}}}
export async function toggleAllEditAccessAction(canEdit:boolean):Promise<AdminActionResult>{
 await requireAdminProfile();
 try{
  const count=await setAllStaffRequestEditing(canEdit);
  revalidatePath("/admin");revalidatePath("/dashboard");
  return{ok:true,message:count?`Request editing ${canEdit?"unlocked":"locked"} for all ${count} staff accounts.`:"No staff accounts to update."};
 }catch(error){return{ok:false,message:error instanceof Error?error.message:"Staff edit access could not be changed. Please try again."}}
}
export async function updateRoleNameAction(userId:string,roleName:string):Promise<AdminActionResult>{await requireAdminProfile();try{await updateRoleName(userId,roleName);revalidatePath("/admin");revalidatePath("/dashboard");return{ok:true,message:"Role name updated."}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Role name could not be updated"}}}
export async function resetPasswordAction(userId:string):Promise<AdminActionResult>{await requireAdminProfile();const password=temporaryPassword();try{await resetAccountPassword(userId,password);revalidatePath("/admin");return{ok:true,message:"Password reset. Copy the temporary password now; it will not be shown again.",temporaryPassword:password}}catch(error){return{ok:false,message:error instanceof Error?error.message:"Password could not be reset"}}}
