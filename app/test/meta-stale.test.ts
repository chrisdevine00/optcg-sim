/**
 * M9 WP1: staleness reads dates from the data and the clock from its caller. The boundary is 60 days:
 * 59 and 60 are fresh, 61 is stale (the Rocks lists are from 8 to 13 Oct, so 2026-12-12 is day 60).
 */
import { describe, expect, it } from 'vitest';
import { dateRange, staleness } from '../src/meta/stale.ts';

const lists = [{ date: '2026-10-13' }, { date: '2026-10-12' }, { date: '2026-10-08' }];
const at = (days: number) => new Date(Date.UTC(2026, 9, 13) + days * 86_400_000);

describe('staleness', () => {
  it('names the range of the lists while they are fresh', () => {
    expect(staleness(lists, at(0))).toEqual({ days: 0, stale: false, label: 'Lists: 8 to 13 Oct' });
  });
  it('is fresh at 59 and 60 days and stale at 61', () => {
    expect(staleness(lists, at(59))).toMatchObject({ days: 59, stale: false });
    expect(staleness(lists, at(60))).toMatchObject({ days: 60, stale: false });
    const s = staleness(lists, at(61));
    expect(s).toEqual({ days: 61, stale: true, label: 'Lists may be out of date (61 days)' });
  });
  it('measures from the newest list, not the oldest', () => {
    // 66 days after the oldest list, 61 after the newest.
    expect(staleness(lists, new Date('2026-12-13T00:00:00Z'))).toMatchObject({
      days: 61,
      stale: true,
    });
    expect(staleness(lists, new Date('2026-12-12T00:00:00Z'))).toMatchObject({
      days: 60,
      stale: false,
    });
  });
  it('ignores the time of day, and the 73-day wording of the design reads from the data', () => {
    expect(staleness(lists, new Date('2026-12-25T23:59:59Z')).label).toBe(
      'Lists may be out of date (73 days)',
    );
  });
  it('has a label when there are no lists', () => {
    expect(staleness([], at(0))).toEqual({ days: 0, stale: false, label: 'No lists' });
  });
});

describe('dateRange', () => {
  it('abbreviates within a month, spells both across months, and names a single day', () => {
    expect(dateRange('2026-10-08', '2026-10-13')).toBe('8 to 13 Oct');
    expect(dateRange('2026-09-29', '2026-10-05')).toBe('29 Sep to 5 Oct');
    expect(dateRange('2026-10-13', '2026-10-13')).toBe('13 Oct');
  });
});
