import Link from "next/link";
import { formatMonth, shiftMonth } from "@/lib/calendar";
export function MonthControls({ month }: { month: string }) { return <nav className="month-controls" aria-label="Calendar month"><div className="month-switcher"><Link href={`/dashboard?month=${shiftMonth(month, -1)}`} aria-label="Previous month">‹</Link><h2>{formatMonth(month)}</h2><Link href={`/dashboard?month=${shiftMonth(month, 1)}`} aria-label="Next month">›</Link></div><Link href="/dashboard" className="today-link">Today</Link></nav>; }
