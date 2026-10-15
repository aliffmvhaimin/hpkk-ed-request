"use client";

import { useState, useTransition } from "react";
import { setRequestDateAccessAction } from "@/lib/requests/date-access-actions";
import { formatDay } from "@/lib/calendar";
import { summarizeLockedDates, isValidRequestRange } from "@/lib/request-date-access";

export function RequestDateAccess({ dates, lockedDates, isAdmin }: { dates: string[]; lockedDates: string[]; isAdmin: boolean }) {
  const [start, setStart] = useState(dates[0]);
  const [end, setEnd] = useState(dates[6]);
  const [pending, startTransition] = useTransition();
  const [locking, setLocking] = useState(true);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inWeek = lockedDates.filter(date => dates.includes(date));
  const ranges = summarizeLockedDates(inWeek);
  const display = (date: string) => formatDay(date, { day: "numeric", month: "short", year: "numeric" });

  function update(locked: boolean) {
    if (!isValidRequestRange(start, end)) {
      setResult({ ok: false, message: "Select a valid date range of up to 366 days." });
      return;
    }
    if (!confirm(`${locked ? "Lock" : "Unlock"} request editing for all staff from ${display(start)} to ${display(end)} (inclusive)?`)) return;
    setLocking(locked);
    setResult(null);
    startTransition(async () => {
      try { setResult(await setRequestDateAccessAction({ start, end, locked })); }
      catch { setResult({ ok: false, message: "Date access could not be confirmed. Please try again." }); }
    });
  }

  return <section className="request-date-access" aria-label="Request date access">
    <div className="date-access-heading"><div><h3>{isAdmin ? "Lock request dates" : "Request editing dates"}</h3><p>Unlocked dates can be edited, including past dates. Account access restrictions still apply.</p></div><span className="date-access-count">{inWeek.length} of 7 dates locked this week</span></div>
    {isAdmin && <div className="date-access-form">
      <label>From<input type="date" value={start} disabled={pending} onChange={e => setStart(e.target.value)} /></label>
      <label>To (inclusive)<input type="date" value={end} min={start} disabled={pending} onChange={e => setEnd(e.target.value)} /></label>
      <button type="button" disabled={pending} onClick={() => update(true)}>{pending && locking ? "Locking…" : "Lock dates"}</button>
      <button type="button" className="secondary" disabled={pending} onClick={() => update(false)}>{pending && !locking ? "Unlocking…" : "Unlock dates"}</button>
    </div>}
    <p className="date-access-summary">{ranges.length ? <>Locked this week: {ranges.map(range => range.start === range.end ? display(range.start) : `${display(range.start)} – ${display(range.end)}`).join(", ")}. Existing requests remain visible.</> : "All dates in this week are open for editing."}</p>
    <div role="status" aria-live="polite" aria-atomic="true">{pending ? <p className="date-access-message">{locking ? "Locking" : "Unlocking"} {display(start)} – {display(end)} for all staff. Please wait…</p> : result && <p className={`date-access-message ${result.ok ? "success" : "error"}`}>{result.message}</p>}</div>
  </section>;
}
