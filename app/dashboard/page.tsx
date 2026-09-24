import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import { requireActiveProfile } from "@/lib/auth/session";
import { CalendarViews } from "@/components/calendar/calendar-views";
import { MonthControls } from "@/components/calendar/month-controls";
import { getCalendarData } from "@/lib/calendar-data";
import { currentKlDate, normalizeMonth } from "@/lib/calendar";
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
 const { profile } = await requireActiveProfile(); const month = normalizeMonth((await searchParams).month); const calendar = await getCalendarData(month);
 return <main className="page-shell calendar-shell"><header className="topbar"><div className="brand-mark">ED</div><div><p className="eyebrow">Signed in as {profile.role_name}</p><h1>{profile.display_name}</h1></div><div className="topbar-links">{profile.role === "admin" && <Link href="/admin">Manage accounts</Link>}<form action={signOutAction}><button type="submit">Sign out</button></form></div></header><section className="calendar-content"><MonthControls month={month}/><CalendarViews key={month} month={month} viewerId={profile.id} canEdit={profile.role === "staff" && profile.can_edit_requests} isAdmin={profile.role === "admin"} today={currentKlDate()} {...calendar}/></section></main>;
}
