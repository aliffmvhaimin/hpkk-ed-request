"use client";
import { useMemo, useState } from "react";
import type { CalendarDateRemark, CalendarGroup, CalendarRequest, CalendarStaff } from "@/lib/calendar-data";
import { formatDay, getCalendarWeeks } from "@/lib/calendar";
import { REQUEST_CODES } from "@/lib/request-codes";
import { MonthControls } from "@/components/calendar/month-controls";
import { WeeklyGrid } from "@/components/calendar/weekly-grid";
import { WeekEditor } from "@/components/calendar/week-editor";
type Props={month:string;viewerId:string;canEdit:boolean;isAdmin:boolean;today:string;staff:CalendarStaff[];groups:CalendarGroup[];entries:CalendarRequest[];dateRemarks:CalendarDateRemark[]};
export function CalendarViews({month,viewerId,canEdit,isAdmin,today,staff,groups,entries,dateRemarks}:Props){
 const weeks=useMemo(()=>getCalendarWeeks(month),[month]);
 const defaultIndex=Math.max(0,weeks.findIndex(w=>today>=w.start&&today<=w.end));
 const[index,setIndex]=useState(defaultIndex),[mobileView,setMobileView]=useState<"agenda"|"grid">(isAdmin?"grid":"agenda");
 const week=weeks[index],weekEntries=entries.filter(e=>week.dates.includes(e.date)),weekGroups=groups.filter(g=>g.weekStart===week.start),viewerEntries=weekEntries.filter(e=>e.ownerId===viewerId),viewerGroup=weekGroups.find(g=>g.ownerId===viewerId);
 return <>
  <div className="roster-control-bar"><div className="calendar-view-heading">
   <div><p className="eyebrow">Shift request roster</p><h2>Weekly Staff Requests</h2><p>{isAdmin?"Review requests and edit date remarks for the department.":canEdit?"Select a request code in your row; all other rows are read only.":"Your request editing access is locked."}</p></div>
   <div className="roster-summary"><span><strong>{staff.length}</strong> active staff</span><span className="read-only-badge">{isAdmin?"Admin view":canEdit?"Your row editable":"Editing locked"}</span></div>
  </div>
  <MonthControls month={month}/><nav className="week-controls" aria-label="Calendar week">
   <button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0} aria-label="Previous week">←</button>
   <div><p className="eyebrow">Week {index+1} of {weeks.length}</p><h3>{formatDay(week.start,{day:"numeric",month:"short"})} – {formatDay(week.end,{day:"numeric",month:"short",year:"numeric"})}</h3></div>
   <button onClick={()=>setIndex(i=>Math.min(weeks.length-1,i+1))} disabled={index===weeks.length-1} aria-label="Next week">→</button>
  </nav></div>
  {!isAdmin&&<div className="mobile-view-toggle" aria-label="Calendar view">
   <button type="button" aria-pressed={mobileView==="agenda"} onClick={()=>setMobileView("agenda")}>My agenda</button>
   <button type="button" aria-pressed={mobileView==="grid"} onClick={()=>setMobileView("grid")}>All staff</button>
  </div>}
  {!isAdmin&&<section className={`personal-agenda${mobileView==="grid"?" mobile-hidden":""}`} aria-label="My weekly agenda">
   {canEdit?<WeekEditor key={week.start} weekStart={week.start} dates={week.dates} today={today} initialEntries={viewerEntries} group={viewerGroup}/>:<article className="agenda-week">
    <h4>{formatDay(week.start,{day:"numeric",month:"short"})} – {formatDay(week.end,{day:"numeric",month:"short"})}</h4>
    <div className="agenda-days">{week.dates.map(date=>{const request=viewerEntries.find(entry=>entry.date===date);return <div key={date}><span>{formatDay(date,{weekday:"short",day:"numeric",month:"short"})}</span><span>{request?.codes.join(", ")||"-"}</span></div>})}</div>
    <p className="week-remark"><strong>Weekly remark:</strong> {viewerGroup?.remark||"-"}</p>
   </article>}
  </section>}
  <div className={mobileView==="agenda"&&!isAdmin?"calendar-grid-panel mobile-hidden":"calendar-grid-panel"}>
   <WeeklyGrid key={week.start} weekStart={week.start} dates={week.dates} month={month} today={today} viewerId={viewerId} canEdit={canEdit} isAdmin={isAdmin} staff={staff} entries={weekEntries} groups={weekGroups} dateRemarks={dateRemarks.filter(r=>week.dates.includes(r.date))}/>
  </div>
  <aside className="code-legend"><h3>Code legend</h3><div>{REQUEST_CODES.map(c=><p key={c.code}><span className={`code-chip code-${c.code.toLowerCase()}`}>{c.code}</span> {c.meaningMs}</p>)}</div></aside>
 </>
}
