import { unzipSync } from "fflate";

export const EXPECTED_SHEETS=["JAN","FEB","MAC","APR","MEI","JUN","JULAI","OGOS","SEPT","OKT","NOV","DIS"];
export const REQUEST_CODES=new Set(["PG","PTG","MLM","KM","HK","CT","K","HKA","HKO"]);
const MONTH=new Map(EXPECTED_SHEETS.map((name,index)=>[name,index+1]));
const decode=(s="")=>s.replace(/&#x([0-9a-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi,(_,h,d,n)=>h?String.fromCodePoint(parseInt(h,16)):d?String.fromCodePoint(Number(d)):({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"})[n]);
const attrs=(s="")=>Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const text=s=>[...s.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m=>decode(m[1])).join("");
export const columnIndex=ref=>[...String(ref).match(/^[A-Z]+/i)?.[0].toUpperCase()??""].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
const rowIndex=ref=>Number(String(ref).match(/\d+$/)?.[0]??0);
const range=ref=>{const [a,b=a]=ref.split(":");return{start:a,end:b,startColumn:columnIndex(a),endColumn:columnIndex(b),startRow:rowIndex(a),endRow:rowIndex(b)}};
const sourceRef=cell=>cell.merge?`${cell.merge.start}:${cell.merge.end}`:cell.ref;

function parseSheet(name,xml,strings){
 const merges=[...xml.matchAll(/<mergeCell\s+ref="([^"]+)"\s*\/?\s*>/g)].map(m=>range(m[1])),anchors=new Map(merges.map(m=>[m.start,m])),cells=new Map(),rows=new Map();
 for(const m of xml.replace(/<c\s[^>]*\/>/g,"").matchAll(/<c\s+([^>]*\br="[^"]+"[^>]*)>([\s\S]*?)<\/c>/g)){
  const a=attrs(m[1]),body=m[2],v=body.match(/<v>([\s\S]*?)<\/v>/)?.[1];let value=null,rich=false;
  if(a.t==="s"&&v!=null){value=strings[Number(v)]?.value??"";rich=strings[Number(v)]?.rich??false}
  else if(a.t==="inlineStr"){value=text(body);rich=/<r(?:\s|>)/.test(body)}
  else if(v!=null){const raw=decode(v);value=raw!==""&&Number.isFinite(Number(raw))?Number(raw):raw}
  const cell={ref:a.r,row:rowIndex(a.r),column:columnIndex(a.r),value,raw:value==null?"":String(value),rich,merge:anchors.get(a.r)??null};
  cells.set(a.r,cell);if(!rows.has(cell.row))rows.set(cell.row,new Map());rows.get(cell.row).set(cell.column,cell);
 }
 return{name,cells,rows,merges};
}

export function parseWorkbook(buffer){
 const zip=unzipSync(new Uint8Array(buffer)),read=p=>{if(!zip[p])throw Error(`Workbook part is missing: ${p}`);return new TextDecoder().decode(zip[p])};
 const shared=zip["xl/sharedStrings.xml"]?[...read("xl/sharedStrings.xml").matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m=>({value:text(m[1]),rich:/<r(?:\s|>)/.test(m[1])})):[];
 const rels=new Map([...read("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\s+([^>]+?)\/?\s*>/g)].map(m=>{const a=attrs(m[1]);return[a.Id,a.Target]}));
 const sheets=[...read("xl/workbook.xml").matchAll(/<sheet\s+([^>]+?)\/?\s*>/g)].map(m=>{const a=attrs(m[1]),target=rels.get(a["r:id"]);return parseSheet(a.name,read(target.startsWith("/")?target.slice(1):`xl/${target.replace(/^\.\//,"")}`),shared)});
 return{sheets};
}

export const normalizeName=value=>String(value??"").normalize("NFKC").trim().replace(/\s+/g," ").toUpperCase();
export const staffIdentityKey=value=>normalizeName(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");
export const usernameFromName=value=>normalizeName(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,".").replace(/^\.+|\.+$/g,"").slice(0,64).replace(/\.+$/g,"");
export const normalizeStaffRole=value=>{const role=normalizeName(value);if(role==="PEMBANTU PERAWATAN KLINIKAL")return "PEMBANTU PERAWATAN KESIHATAN";return new Set(["JURURAWAT TERLATIH","PENOLONG PEGAWAI PERUBATAN","PEMBANTU PERAWATAN KESIHATAN"]).has(role)?role:null};
export const normalizeCode=value=>{const code=String(value??"").trim().toUpperCase();return REQUEST_CODES.has(code)?code:null};
function serialDate(n){let d=Math.floor(n);if(d>59)d--;return new Date(Date.UTC(1899,11,31+d))}
export function parseSourceDate(value,sheet,year=2026){
 const sm=MONTH.get(String(sheet).toUpperCase());if(!sm)return{date:null,reason:"unknown source month sheet"};let day,month;
 if(typeof value==="number"){const d=serialDate(value);day=d.getUTCMonth()+1;month=d.getUTCDate()}
 else{const m=String(value??"").trim().match(/^(\d{1,2})\s*[\/-]\s*(\d{1,2})/);if(!m)return{date:null,reason:"date is neither an Excel serial nor d/m text"};day=Number(m[1]);month=Number(m[2])}
 if(month<1||month>12||day<1||day>31)return{date:null,reason:"date components are outside the calendar range"};
 let y=year;if(sm===1&&month===12)y--;if(sm===12&&month===1)y++;
 if(![sm,sm===1?12:sm-1,sm===12?1:sm+1].includes(month))return{date:null,reason:`date month ${month} is not adjacent to ${sheet}`};
 const d=new Date(Date.UTC(y,month-1,day));if(d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return{date:null,reason:"date does not exist"};return{date:d.toISOString().slice(0,10),reason:null};
}
const monday=iso=>{const d=new Date(`${iso}T00:00:00Z`),day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-day+1);return d.toISOString().slice(0,10)};
const nonempty=sheet=>[...sheet.cells.values()].filter(c=>c.value!==null&&String(c.value)!=="");

export function buildStaffRoster(workbook,{profiles=[]}={}){
 const people=new Map(),reserved=new Set(profiles.map(p=>String(p.username??"").toLowerCase()).filter(Boolean));
 const sheetsByName=new Map(workbook.sheets.map(sheet=>[sheet.name,sheet]));
 for(const sheetName of EXPECTED_SHEETS){
  const sheet=sheetsByName.get(sheetName);if(!sheet)continue;
  const headerRow=[...sheet.rows].find(([,r])=>[...r.values()].filter(c=>normalizeName(c.value)==="CATATAN").length>=4)?.[0];if(!headerRow)throw Error(`${sheet.name}: weekly header row not found`);
  const remarks=[...(sheet.rows.get(headerRow)??new Map()).values()].filter(c=>normalizeName(c.value)==="CATATAN").map(c=>c.column);let roleName=null;
  for(const [rn,row] of [...sheet.rows].sort((a,b)=>a[0]-b[0])){if(rn<=headerRow+1)continue;const cell=row.get(0),raw=cell?.raw.trim()??"";if(!raw)continue;
   const heading=sheet.merges.some(m=>m.startRow===rn&&m.endRow===rn&&remarks.includes(m.endColumn));if(heading){roleName=normalizeStaffRole(raw);if(!roleName)throw Error(`${sheet.name}!${cell.ref}: unknown staff role heading ${raw}`);continue}if(!roleName)continue;
   const key=staffIdentityKey(raw);if(!key)continue;const current=people.get(key);if(current){current.source_names.add(normalizeName(raw));current.source_refs.push(`${sheet.name}!${cell.ref}`);if(current.role_name!==roleName)throw Error(`${raw}: staff role changes between workbook sections`);continue}
   people.set(key,{identity_key:key,display_name:normalizeName(raw),role_name:roleName,source_names:new Set([normalizeName(raw)]),source_refs:[`${sheet.name}!${cell.ref}`]});
  }
 }
 const roster=[];for(const person of people.values()){
  const existing=profiles.find(p=>staffIdentityKey(p.display_name)===person.identity_key);let username=existing?.username?String(existing.username).toLowerCase():usernameFromName(person.display_name);if(!username)username="staff";
  if(!existing){const base=username;let suffix=2;while(reserved.has(username)){const tail=`.${suffix++}`;username=`${base.slice(0,64-tail.length).replace(/\.+$/g,"")}${tail}`}}
  reserved.add(username);roster.push({...person,source_names:[...person.source_names],username,workbook_order:roster.length+1,existing_profile_id:existing?.id??null});
 }
 return roster;
}

function resolver(profiles,aliases){
 const names=new Map(),users=new Map();for(const p of profiles){const n=staffIdentityKey(p.display_name);if(!names.has(n))names.set(n,[]);names.get(n).push(p);users.set(String(p.username).toLowerCase(),p)}
 const map=new Map(Object.entries(aliases??{}).map(([n,u])=>[normalizeName(n),String(u).toLowerCase()]));
 return name=>{const normalized=normalizeName(name),key=staffIdentityKey(name),list=map.has(normalized)?[users.get(map.get(normalized))].filter(Boolean):names.get(key)??[];if(list.length!==1)return{profile:null,reason:list.length>1?"staff name matches multiple profiles":"staff name has no confirmed profile"};const p=list[0];if(p.role!=="staff"||!p.is_active)return{profile:null,reason:p.role!=="staff"?"matched profile is not staff":"matched staff profile is disabled"};return{profile:p,reason:null}};
}

export function buildMigrationPlan(workbook,{profiles=[],aliases={},existingGroups=[],sourceWorkbook="ED STAFF REQUEST 2026.xlsx"}={}){
 const names=workbook.sheets.map(s=>s.name);if(EXPECTED_SHEETS.some(n=>!names.includes(n))||names.some(n=>!EXPECTED_SHEETS.includes(n)))throw Error("Workbook sheets do not match the 12-month contract");
 const records=[],seen=new Set(),candidates=[],resolve=resolver(profiles,aliases),existing=new Set(existingGroups.map(g=>`${g.owner_id}|${g.week_start}`));
 const add=r=>{const k=`${r.sheet}!${r.ref}`;if(seen.has(k))throw Error(`Source cell classified twice: ${k}`);seen.add(k);records.push(r)};
 for(const sheet of workbook.sheets){
  const headerRow=[...sheet.rows].find(([,r])=>[...r.values()].filter(c=>normalizeName(c.value)==="CATATAN").length>=4)?.[0];if(!headerRow)throw Error(`${sheet.name}: weekly header row not found`);
  const dateRow=headerRow+1,header=sheet.rows.get(headerRow)??new Map(),dates=sheet.rows.get(dateRow)??new Map(),remarks=[...header.values()].filter(c=>normalizeName(c.value)==="CATATAN").map(c=>c.column);if(remarks.length!==5)throw Error(`${sheet.name}: expected 5 CATATAN columns`);
  const dateCols=remarks.flatMap(c=>Array.from({length:7},(_,i)=>c-7+i)),parsed=new Map();
  for(const col of dateCols){const c=dates.get(col);if(c&&String(c.value).trim()){const p=parseSourceDate(c.value,sheet.name);if(p.date){const slot=(col-1)%8,wd=(new Date(`${p.date}T00:00:00Z`).getUTCDay()+6)%7;if(slot!==wd)p.reason="date weekday does not match weekly column"}parsed.set(col,p)}}
  for(const c of nonempty(sheet).filter(c=>c.row<=dateRow)){const p=c.row===dateRow&&dateCols.includes(c.column)?parsed.get(c.column):null;add({sheet:sheet.name,ref:sourceRef(c),raw:c.raw,status:p&&(!p.date||p.reason)?"pending_review":"ignored",reason:p&&(!p.date||p.reason)?p.reason:"structural workbook content",staff:null})}
  for(const [rn,row] of [...sheet.rows].filter(([r])=>r>dateRow)){
   const filled=[...row.values()].filter(c=>c.value!==null&&String(c.value)!=="");if(!filled.length)continue;const nameCell=row.get(0),staff=nameCell?.raw.trim()??"";
   const section=sheet.merges.some(m=>m.startRow===rn&&m.endRow===rn&&remarks.includes(m.endColumn));if(section){for(const c of filled)add({sheet:sheet.name,ref:sourceRef(c),raw:c.raw,status:"ignored",reason:"staff category heading",staff:null});continue}
   const match=staff?resolve(staff):{profile:null,reason:"request row has no staff name"};if(nameCell&&staff)add({sheet:sheet.name,ref:sourceRef(nameCell),raw:nameCell.raw,status:match.profile?"resolved":"pending_review",reason:match.profile?"staff profile matched":match.reason,target_table:match.profile?"profiles":null,target_id:match.profile?.id??null,staff});
   const body=filled.filter(c=>c.column!==0);
   for(const rc of remarks){const cols=Array.from({length:7},(_,i)=>rc-7+i),remark=row.get(rc),requests=body.filter(c=>cols.includes(c.column)),exact=[];
    for(const c of requests){const p=parsed.get(c.column),code=normalizeCode(c.value);let reason=c.merge&&c.merge.endColumn>c.merge.startColumn?"merged request spans multiple dates":c.rich?"rich-text request requires review":!p?.date||p.reason?p?.reason??"request date missing":!code?"request is combined, annotated, or unrecognized":!match.profile?match.reason:null;if(reason)add({sheet:sheet.name,ref:sourceRef(c),raw:c.raw,status:"pending_review",reason,staff:staff||null});else exact.push({cell:c,code,date:p.date})}
    if(exact.length){const weeks=new Set(exact.map(e=>monday(e.date))),note=remark?.raw.trim()??"";let reason=weeks.size!==1?"weekly block dates do not share one week":!note?"weekly remark is required":remark?.rich?"rich-text remark requires review":null;if(reason){for(const e of exact)add({sheet:sheet.name,ref:sourceRef(e.cell),raw:e.cell.raw,status:"pending_review",reason,staff});if(remark)add({sheet:sheet.name,ref:sourceRef(remark),raw:remark.raw,status:"pending_review",reason,staff})}else candidates.push({key:`${match.profile.id}|${[...weeks][0]}`,owner_id:match.profile.id,staff,week_start:[...weeks][0],remark:note,remarkCell:remark,entries:exact,sheet:sheet.name})}
    else if(remark)add({sheet:sheet.name,ref:sourceRef(remark),raw:remark.raw,status:"pending_review",reason:requests.length?"remark has no resolvable request":"remark has no request",staff:staff||null});
   }
   for(const c of body){const k=`${sheet.name}!${sourceRef(c)}`;if(!seen.has(k)&&!dateCols.includes(c.column)&&!remarks.includes(c.column))add({sheet:sheet.name,ref:sourceRef(c),raw:c.raw,status:"ignored",reason:"content outside request grid",staff:staff||null})}
  }
 }
 const groupCounts=new Map(),dateCounts=new Map();for(const g of candidates){groupCounts.set(g.key,(groupCounts.get(g.key)??0)+1);for(const e of g.entries){const k=`${g.owner_id}|${e.date}`;dateCounts.set(k,(dateCounts.get(k)??0)+1)}}
 const groups=[];for(const g of candidates){let reason=existing.has(g.key)?"database already contains this staff week":groupCounts.get(g.key)>1?"staff week appears in multiple workbook blocks":g.entries.some(e=>dateCounts.get(`${g.owner_id}|${e.date}`)>1)?"staff date appears more than once":null;if(reason){for(const e of g.entries)add({sheet:g.sheet,ref:sourceRef(e.cell),raw:e.cell.raw,status:"pending_review",reason,staff:g.staff});add({sheet:g.sheet,ref:sourceRef(g.remarkCell),raw:g.remarkCell.raw,status:"pending_review",reason,staff:g.staff});continue}
  const entries=g.entries.map(e=>{add({sheet:g.sheet,ref:sourceRef(e.cell),raw:e.cell.raw,status:"resolved",reason:"exact request mapped",target_table:"request_entries",staff:g.staff});return{request_date:e.date,code:e.code,source_sheet:g.sheet,source_ref:sourceRef(e.cell),raw_value:e.cell.raw}});add({sheet:g.sheet,ref:sourceRef(g.remarkCell),raw:g.remarkCell.raw,status:"resolved",reason:"weekly remark mapped",target_table:"weekly_request_groups",staff:g.staff});groups.push({owner_id:g.owner_id,week_start:g.week_start,remark:g.remark,source_sheet:g.sheet,remark_source_ref:sourceRef(g.remarkCell),remark_raw_value:g.remarkCell.raw,entries})}
 const sourceCells=workbook.sheets.reduce((n,s)=>n+nonempty(s).length,0);if(records.length!==sourceCells)throw Error(`Reconciliation failed: ${records.length} records for ${sourceCells} source cells`);
 const summarize=key=>{const out={};for(const r of records){const k=r[key]??"(none)";out[k]??={resolved:0,pending_review:0,ignored:0,total:0};out[k][r.status]++;out[k].total++}return out},byStatus=summarize("status");
 return{source_workbook:sourceWorkbook,records,groups,summary:{sheets:12,source_cells:sourceCells,resolved:byStatus.resolved?.total??0,pending_review:byStatus.pending_review?.total??0,ignored:byStatus.ignored?.total??0,import_groups:groups.length,import_entries:groups.reduce((n,g)=>n+g.entries.length,0),by_sheet:summarize("sheet"),by_staff:(()=>{const out={};for(const r of records.filter(r=>r.staff)){out[r.staff]??={resolved:0,pending_review:0,ignored:0,total:0};out[r.staff][r.status]++;out[r.staff].total++}return out})()}};
}

export function toReviewMarkdown(plan,{sourceHash,generatedAt=new Date().toISOString(),mode="dry-run",roster=[]}={}){
 const s=plan.summary,lines=["# Workbook migration reconciliation","",`- Source: \`${plan.source_workbook}\``,`- SHA-256: \`${sourceHash}\``,`- Generated: ${generatedAt}`,`- Mode: ${mode}`,`- Source cells: ${s.source_cells}`,`- Resolved: ${s.resolved}`,`- Pending review: ${s.pending_review}`,`- Intentionally ignored: ${s.ignored}`,`- Importable request entries: ${s.import_entries}`,"","## Staff accounts","","| Display name | Username | Role | Account |","| --- | --- | --- | --- |"];for(const person of roster)lines.push(`| ${person.display_name.replaceAll("|","\\|")} | @${person.username} | ${person.role_name} | ${person.existing_profile_id?"Existing":"To create"} |`);lines.push("","## Sheet reconciliation","","| Sheet | Cells | Resolved | Review | Ignored |","| --- | ---: | ---: | ---: | ---: |");for(const name of EXPECTED_SHEETS){const r=s.by_sheet[name];lines.push(`| ${name} | ${r.total} | ${r.resolved} | ${r.pending_review} | ${r.ignored} |`)}
 lines.push("","## Staff reconciliation","","| Staff source value | Cells | Resolved | Review | Ignored |","| --- | ---: | ---: | ---: | ---: |");for(const [name,r] of Object.entries(s.by_staff).sort(([a],[b])=>a.localeCompare(b)))lines.push(`| ${name.replaceAll("|","\\|")} | ${r.total} | ${r.resolved} | ${r.pending_review} | ${r.ignored} |`);
 lines.push("","## Review queue","","| Sheet | Cell/range | Staff | Raw value | Reason |","| --- | --- | --- | --- | --- |");const safe=v=>String(v??"").replace(/[\r\n]+/g," ").replaceAll("|","\\|");for(const r of plan.records.filter(r=>r.status==="pending_review"))lines.push(`| ${safe(r.sheet)} | ${safe(r.ref)} | ${safe(r.staff)} | ${safe(r.raw)} | ${safe(r.reason)} |`);return lines.join("\n")+"\n";
}
