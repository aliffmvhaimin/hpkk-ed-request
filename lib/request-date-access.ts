import { addDays } from "@/lib/calendar";

export function isValidRequestDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidRequestRange(start: string, end: string) {
  return isValidRequestDate(start) && isValidRequestDate(end) && start <= end && end <= addDays(start, 365);
}

export function summarizeLockedDates(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  const ranges: { start: string; end: string }[] = [];
  for (const date of sorted) {
    const last = ranges.at(-1);
    if (last && addDays(last.end, 1) === date) last.end = date;
    else ranges.push({ start: date, end: date });
  }
  return ranges;
}
