import Link from "next/link";
import { formatMonth, shiftMonth } from "@/lib/calendar";
export function MonthControls({ month }: { month: string }) { return <nav className="month-controls" aria-label="Calendar month"><Link href={`/dashboard?month=${shiftMonth(month, -1)}`} aria-label="Previous month">←</Link><div><p className="eyebrow">Request calendar</p><h2>{formatMonth(month)}</h2></div><Link href={`/dashboard?month=${shiftMonth(month, 1)}`} aria-label="Next month">→</Link></nav>; }
