import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { signOutAction } from "@/lib/auth/actions";
import { requireActiveProfile } from "@/lib/auth/session";
import { CalendarViews } from "@/components/calendar/calendar-views";
import { getCalendarData } from "@/lib/calendar-data";
import { currentKlDate, normalizeMonth } from "@/lib/calendar";
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
 const { profile } = await requireActiveProfile(); const month = normalizeMonth((await searchParams).month); const calendar = await getCalendarData(month);
 return <main className="page-shell calendar-shell"><header className="topbar roster-topbar"><div className="brand-mark">ED</div><div className="roster-brand"><div className="roster-title-line"><h1>Work Card Admin</h1><span className="admin-status"><i />{profile.role === "admin" ? "Administrator" : profile.role_name}</span></div><p>Jabatan Kecemasan &amp; Trauma <span>•</span> Shift Request Management</p></div><div className="topbar-links"><nav className="global-view-switcher" aria-label="Workspace"><Link href="/dashboard" className="nav-icon-link active" aria-current="page"><UiIcon name="calendar"/><b>View Calendar</b></Link>{profile.role === "admin" && <Link href="/admin" className="nav-icon-link " ><UiIcon name="users"/><b>Staff &amp; Accounts</b></Link>}<Link href="/settings" className="nav-icon-link "  aria-label="Settings"><UiIcon name="settings"/><b>Settings</b></Link></nav><form action={signOutAction}><button type="submit" className="sign-out-button" title={`Sign out ${profile.display_name}`}><UiIcon name="logout"/><span>Sign out</span></button></form></div></header><section className="calendar-content"><CalendarViews key={month} month={month} viewerId={profile.id} canEdit={profile.role === "staff" && profile.can_edit_requests} isAdmin={profile.role === "admin"} today={currentKlDate()} {...calendar}/></section></main>;
}
