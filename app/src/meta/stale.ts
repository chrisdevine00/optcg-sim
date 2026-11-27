/**
 * M9 WP1: how old an archetype's sourced lists are. The clock is a parameter (never read here), so a
 * test pins the boundary and the app passes `new Date()`. The flag starts after 60 days (PROMPT: Meta
 * Explorer), measured from the newest list.
 */
import type { Staleness } from './types.ts';

export const STALE_AFTER_DAYS = 60;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86_400_000;

/** `YYYY-MM-DD` to UTC midnight, or null when it is not a date. */
function utcDay(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "8 Oct", for use after "to". */
const dm = (t: number) => `${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`;

/** "8 to 13 Oct", "29 Sep to 5 Oct", or "13 Oct" for one day. */
export function dateRange(from: string, to: string): string {
  const a = utcDay(from);
  const b = utcDay(to);
  if (a === null || b === null) return `${from} to ${to}`;
  if (a === b) return dm(a);
  const sameMonth = new Date(a).getUTCMonth() === new Date(b).getUTCMonth();
  return `${sameMonth ? String(new Date(a).getUTCDate()) : dm(a)} to ${dm(b)}`;
}

/** Days from the newest list date to `today` (UTC calendar days), the flag, and the tile's label. */
export function staleness(lists: readonly { date: string }[], today: Date): Staleness {
  const days = lists.flatMap((l) => utcDay(l.date) ?? []);
  if (days.length === 0) return { days: 0, stale: false, label: 'No lists' };
  const newest = Math.max(...days);
  const oldest = Math.min(...days);
  const todayDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const age = Math.floor((todayDay - newest) / DAY);
  const stale = age > STALE_AFTER_DAYS;
  const range = dateRange(
    new Date(oldest).toISOString().slice(0, 10),
    new Date(newest).toISOString().slice(0, 10),
  );
  return {
    days: age,
    stale,
    label: stale ? `Lists may be out of date (${age} days)` : `Lists: ${range}`,
  };
}
