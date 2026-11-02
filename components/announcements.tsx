"use client";

import { useState, useTransition } from "react";
import type { Announcement } from "@/lib/announcements";
import { publishAnnouncementAction, removeAnnouncementAction } from "@/lib/announcement-actions";
import { currentKlDate, formatDay } from "@/lib/calendar";

export function Announcements({ announcements, isAdmin, loadError = null }: { announcements: Announcement[]; isAdmin: boolean; loadError?: string | null }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [closureDate, setClosureDate] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const displayDate = (date: string) => formatDay(date, { day: "numeric", month: "long", year: "numeric" });

  if (!isAdmin && announcements.length === 0 && !loadError) return null;

  function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      try {
        const response = await publishAnnouncementAction({ title, message, closureDate });
        setResult(response);
        if (response.ok) { setTitle(""); setMessage(""); setClosureDate(""); }
      } catch { setResult({ ok: false, message: "Announcement could not be published. Please try again." }); }
    });
  }

  function remove(announcement: Announcement) {
    if (!confirm(`Remove announcement “${announcement.title}” for all staff?`)) return;
    setResult(null);
    startTransition(async () => {
      try { setResult(await removeAnnouncementAction(announcement.id)); }
      catch { setResult({ ok: false, message: "Announcement could not be removed. Please try again." }); }
    });
  }

  return <section className="announcements" aria-labelledby="announcements-heading">
    <div className="announcements-heading"><h2 id="announcements-heading">Announcements</h2><span>Staff notices</span></div>
    <div className="announcement-list">
      {announcements.map(announcement => <article key={announcement.id} className="announcement-card">
        <div className="announcement-card-heading"><h3>{announcement.title}</h3>{isAdmin && <button type="button" className="announcement-remove" disabled={pending} aria-label={`Remove announcement: ${announcement.title}`} onClick={() => remove(announcement)}>Remove</button>}</div>
        {announcement.closure_date && <p className="announcement-closure">Requests close on <time dateTime={announcement.closure_date}>{displayDate(announcement.closure_date)}</time></p>}
        <p className="announcement-message">{announcement.message}</p>
        <p className="announcement-published">Posted <time dateTime={announcement.created_at}>{displayDate(currentKlDate(new Date(announcement.created_at)))}</time></p>
      </article>)}
      {loadError && <p className="announcement-help" role="status">{loadError}</p>}
      {isAdmin && !loadError && announcements.length === 0 && <p className="announcement-help">No announcements yet. Publish a notice to keep staff informed.</p>}
    </div>
    {isAdmin && !loadError && <details className="announcement-compose"><summary>Post an announcement</summary>
      <form onSubmit={publish}>
        <label>Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={100} required disabled={pending} placeholder="e.g. December request deadline" /></label>
        <label>Message<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={2000} rows={3} required disabled={pending} placeholder="Let staff know when requests will close and what they need to do." /></label>
        <label>Request closure date (optional)<input type="date" value={closureDate} onChange={event => setClosureDate(event.target.value)} disabled={pending} /></label>
        <p className="announcement-help">This date is a notice for staff. Use “Lock request dates” below to close request editing.</p>
        <button type="submit" disabled={pending}>{pending ? "Please wait…" : "Publish announcement"}</button>
      </form>
    </details>}
    <div role="status" aria-live="polite" aria-atomic="true">{result && <p className={`date-access-message ${result.ok ? "success" : "error"}`}>{result.message}</p>}</div>
  </section>;
}
