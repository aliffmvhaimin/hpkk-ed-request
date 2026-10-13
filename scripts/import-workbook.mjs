import {createHash,randomBytes} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {createClient} from "@supabase/supabase-js";
import {buildMigrationPlan,buildStaffRoster,parseWorkbook,toReviewMarkdown} from "./workbook-migration-lib.mjs";

function args(values){const o={workbook:"ED STAFF REQUEST 2026.xlsx",mapping:"scripts/workbook-import-map.json",reportDir:"migration-reports",apply:false};for(let i=0;i<values.length;i++){if(values[i]==="--apply")o.apply=true;else if(values[i]==="--workbook")o.workbook=values[++i];else if(values[i]==="--mapping")o.mapping=values[++i];else if(values[i]==="--report-dir")o.reportDir=values[++i];else throw Error(`Unknown argument: ${values[i]}`)}return o}
async function env(){for(const line of(await readFile(".env.local","utf8")).split(/\r?\n/)){const i=line.indexOf("=");if(i>0&&!line.trimStart().startsWith("#"))process.env[line.slice(0,i)]??=line.slice(i+1)}if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error("Supabase server environment is incomplete")}
const temporaryPassword=()=>`${randomBytes(18).toString("base64url")}Aa1!`;
const authEmail=username=>`${username}@hpkk-ed-request.local`;

async function loadProfiles(db){const q=await db.from("profiles").select("id,username,display_name,role,role_name,workbook_order,is_active");if(q.error)throw q.error;return q.data}
async function provisionRoster(db,workbook,profiles,credentialsPath){
 const roster=buildStaffRoster(workbook,{profiles}),created=[];
 for(const person of roster){
  if(person.existing_profile_id){const profile=profiles.find(p=>p.id===person.existing_profile_id);if(profile.role!=="staff")throw Error(`${person.display_name}: matching account is not a staff account`);if(profile.role_name!==person.role_name||profile.workbook_order!==person.workbook_order){const q=await db.from("profiles").update({role_name:person.role_name,workbook_order:person.workbook_order}).eq("id",profile.id);if(q.error)throw q.error}continue}
  const password=temporaryPassword(),auth=await db.auth.admin.createUser({email:authEmail(person.username),password,email_confirm:true});if(auth.error||!auth.data.user)throw auth.error??Error(`Could not create ${person.username}`);
  const profile=await db.from("profiles").insert({id:auth.data.user.id,username:person.username,username_display:person.username,display_name:person.display_name,role:"staff",role_name:person.role_name,workbook_order:person.workbook_order,must_change_password:true,is_active:true,can_edit_requests:true});
  if(profile.error){await db.auth.admin.deleteUser(auth.data.user.id);throw profile.error}
  created.push({username:person.username,temporary_password:password,display_name:person.display_name,role_name:person.role_name});
  await writeFile(credentialsPath,JSON.stringify({created_at:new Date().toISOString(),accounts:created},null,2)+"\n");
 }
 return created;
}

async function main(){
 const o=args(process.argv.slice(2));await env();await mkdir(o.reportDir,{recursive:true});
 const bytes=await readFile(o.workbook),hash=createHash("sha256").update(bytes).digest("hex"),sourceWorkbook=path.basename(o.workbook),workbook=parseWorkbook(bytes),mapping=JSON.parse(await readFile(o.mapping,"utf8"));
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});let profiles=await loadProfiles(db);
 const prior=await db.from("import_records").select("source_hash").eq("source_workbook",sourceWorkbook).limit(1);if(prior.error)throw prior.error;if(o.apply&&prior.data[0]?.source_hash&&prior.data[0].source_hash!==hash)throw Error("This workbook name was already imported with a different file hash");
 const credentialsPath=path.join(o.reportDir,"workbook-created-accounts.json");let createdAccounts=[];if(o.apply){createdAccounts=await provisionRoster(db,workbook,profiles,credentialsPath);profiles=await loadProfiles(db)}
 const roster=buildStaffRoster(workbook,{profiles}),owners=profiles.filter(x=>x.role==="staff").map(x=>x.id);let existing=[];
 if(owners.length){const q=await db.from("weekly_request_groups").select("owner_id,week_start,source").in("owner_id",owners).gte("week_start","2025-12-01").lte("week_start","2027-01-31");if(q.error)throw q.error;existing=q.data}
 const plan=buildMigrationPlan(workbook,{profiles,aliases:mapping.aliases??{},existingGroups:existing,sourceWorkbook});const at=new Date().toISOString(),base=path.join(o.reportDir,"workbook-migration-reconciliation"),missingAccounts=roster.filter(x=>!x.existing_profile_id).length;
 await writeFile(`${base}.json`,JSON.stringify({generated_at:at,mode:o.apply?"apply":"dry-run",source_hash:hash,staff_roster:roster,...plan},null,2)+"\n");await writeFile(`${base}.md`,toReviewMarkdown(plan,{sourceHash:hash,generatedAt:at,mode:o.apply?"apply":"dry-run",roster}));
 if(o.apply){if(!plan.summary.import_entries&&!prior.data[0])throw Error("Apply refused: no request entries map to active workbook staff profiles");const records=plan.records.filter(r=>r.status!=="resolved"||r.target_table==="profiles").map(r=>({source_sheet:r.sheet,source_ref:r.ref,raw_value:r.raw,status:r.status,review_note:r.reason,target_table:r.target_table??null,target_id:r.target_id??null}));const call=await db.rpc("apply_workbook_import",{p_source_workbook:plan.source_workbook,p_source_hash:hash,p_groups:plan.groups,p_records:records});if(call.error)throw call.error;console.log(JSON.stringify({mode:"apply",result:call.data,created_accounts:createdAccounts.length,credentials:createdAccounts.length?credentialsPath:null,reports:[`${base}.json`,`${base}.md`]}))}
 else console.log(JSON.stringify({mode:"dry-run",summary:{sheets:plan.summary.sheets,source_cells:plan.summary.source_cells,resolved:plan.summary.resolved,pending_review:plan.summary.pending_review,ignored:plan.summary.ignored,import_groups:plan.summary.import_groups,import_entries:plan.summary.import_entries,staff_accounts:roster.length,accounts_to_create:missingAccounts},reports:[`${base}.json`,`${base}.md`]}))
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
