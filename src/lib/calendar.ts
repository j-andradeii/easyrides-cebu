/**
 * Calendar grid maths for /admin/calendar. Client-safe (no server imports).
 *
 * Everything here is deliberately local-time. `opportunities.preferred_date` is
 * a DATE — "2026-08-14", no zone — and the grid it drops into is built from the
 * agent's own clock, so the two only line up if both stay local. Routing any of
 * it through `toISOString()` would push both into UTC and land a Cebu trip on
 * the previous day, which is why `toDateKey` builds the string by hand.
 */

/** Sunday-first, matching the grid's column order. */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** A month grid is at most six rows — the loop guard, not a target. */
const MAX_GRID_DAYS = 42;

/** Local 'YYYY-MM-DD' — the same shape the DATE column serializes to. */
export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const result = startOfDay(date);
  result.setDate(result.getDate() + amount);
  return result;
}

/**
 * Anchored on the 1st, so stepping from Jan 31 lands in February rather than
 * overflowing to March 3 the way `setMonth` would.
 */
export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -startOfDay(date).getDay());
}

export function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

export function isToday(date: Date): boolean {
  return toDateKey(date) === toDateKey(new Date());
}

function daysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);

  while (cursor <= last && days.length < MAX_GRID_DAYS) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

/**
 * The whole month padded out to complete weeks — 28 to 42 days. Padding with
 * the neighbouring months' days rather than blanks means a trip on the 1st of
 * next month is already visible while you plan the end of this one.
 */
export function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return daysBetween(startOfWeek(first), endOfWeek(last));
}

export function buildWeekGrid(anchor: Date): Date[] {
  return daysBetween(startOfWeek(anchor), endOfWeek(anchor));
}

const MONTH_YEAR = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' });
const MONTH_DAY = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' });
const MONTH_DAY_YEAR = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const DAY_ONLY = new Intl.DateTimeFormat('en-PH', { day: 'numeric' });

/** "August 2026" */
export function formatMonthLabel(date: Date): string {
  return MONTH_YEAR.format(date);
}

/**
 * "Aug 9 – 15, 2026", widening to "Aug 30 – Sep 5, 2026" or full dates on both
 * sides when the week straddles a year.
 */
export function formatWeekLabel(start: Date, end: Date): string {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${MONTH_DAY_YEAR.format(start)} – ${MONTH_DAY_YEAR.format(end)}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${MONTH_DAY.format(start)} – ${MONTH_DAY_YEAR.format(end)}`;
  }
  return `${MONTH_DAY.format(start)} – ${DAY_ONLY.format(end)}, ${end.getFullYear()}`;
}
