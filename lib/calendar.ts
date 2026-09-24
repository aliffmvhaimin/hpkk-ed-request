export const KUALA_LUMPUR_TIME_ZONE = "Asia/Kuala_Lumpur";
const ISO_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
export const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
export const parseIsoDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
export function addDays(value: string, amount: number) { const date = parseIsoDate(value); date.setUTCDate(date.getUTCDate() + amount); return toIsoDate(date); }
export function currentKlMonth(now = new Date()) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: KUALA_LUMPUR_TIME_ZONE, year: "numeric", month: "2-digit" }).formatToParts(now); return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`; }
export function normalizeMonth(value: string | string[] | undefined, fallback = currentKlMonth()) { const candidate = Array.isArray(value) ? value[0] : value; return candidate && ISO_MONTH.test(candidate) ? candidate : fallback; }
export function shiftMonth(month: string, amount: number) { const [year, monthNumber] = month.split("-").map(Number); return toIsoDate(new Date(Date.UTC(year, monthNumber - 1 + amount, 1))).slice(0, 7); }
export function getMonthRange(month: string) { const [year, monthNumber] = month.split("-").map(Number); const monthStart = `${month}-01`; const monthEnd = toIsoDate(new Date(Date.UTC(year, monthNumber, 0))); const startDay = parseIsoDate(monthStart).getUTCDay() || 7; const endDay = parseIsoDate(monthEnd).getUTCDay() || 7; return { monthStart, monthEnd, queryStart: addDays(monthStart, 1 - startDay), queryEnd: addDays(monthEnd, 7 - endDay) }; }
export function getCalendarWeeks(month: string) { const { queryStart, queryEnd } = getMonthRange(month); const weeks: { start: string; end: string; dates: string[] }[] = []; for (let start = queryStart; start <= queryEnd; start = addDays(start, 7)) { const dates = Array.from({ length: 7 }, (_, index) => addDays(start, index)); weeks.push({ start, end: dates[6], dates }); } return weeks; }
export function formatMonth(month: string) { return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric", timeZone: "UTC" }).format(parseIsoDate(`${month}-01`)); }
export function formatDay(date: string, options?: Intl.DateTimeFormatOptions) { return new Intl.DateTimeFormat("en-MY", { timeZone: "UTC", ...options }).format(parseIsoDate(date)); }


export function currentKlDate(now = new Date()) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: KUALA_LUMPUR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now); return `${parts.find(p=>p.type==="year")?.value}-${parts.find(p=>p.type==="month")?.value}-${parts.find(p=>p.type==="day")?.value}`; }
