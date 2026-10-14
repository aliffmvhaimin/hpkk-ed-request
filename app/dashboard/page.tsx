import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import { requireActiveProfile } from "@/lib/auth/session";
import { CalendarViews } from "@/components/calendar/calendar-views";
import { MonthControls } from "@/components/calendar/month-controls";
import { getCalendarData } from "@/lib/calendar-data";
import { currentKlDate, normalizeMonth } from "@/lib/calendar";
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
 const { profile } = await requireActiveProfile(); const month = normalizeMonth((await searchParams).month); const calendar = await getCalendarData(month);
 return <main className="page-shell calendar-shell"><header className="topbar roster-topbar"><div className="brand-mark">ED</div><div className="roster-brand"><div className="roster-title-line"><h1>Work Card Admin</h1><span className="admin-status"><i />{profile.role === "admin" ? "Administrator" : profile.role_name}</span></div><p>Jabatan Kecemasan &amp; Trauma <span>•</span> Shift Request Management</p></div><div className="topbar-links"><Link href="/settings" className="nav-icon-link"><span aria-hidden="true">⚙</span><b>Settings</b></Link>{profile.role === "admin" && <Link href="/admin" className="nav-icon-link"><span aria-hidden="true">♙</span><b>Staff &amp; Accounts</b></Link>}<form action={signOutAction}><button type="submit" className="profile-button" title={`Sign out ${profile.display_name}`}>{profile.display_name.slice(0,1).toUpperCase()}<span className="sr-only">Logout</span></button></form></div></header><section className="calendar-content"><MonthControls month={month}/><CalendarViews key={month} month={month} viewerId={profile.id} canEdit={profile.role === "staff" && profile.can_edit_requests} isAdmin={profile.role === "admin"} today={currentKlDate()} {...calendar}/></section></main>;
}
