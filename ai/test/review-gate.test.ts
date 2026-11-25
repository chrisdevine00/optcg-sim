/**
 * The 60 s gate (PLAN row 19), in this thread: a review of the 300-decision fixture finishes inside
 * the deadline, every item either run or left under a "deadline" marker. Slow (it plays the fixture
 * game and reviews it with wall-clock caps), so it runs on demand:
 * `REVIEW_GATE=1 npx vitest run ai/test/review-gate.test.ts`. The app's pool runs the same items on
 * up to three workers, so this is its worst case.
 */
import { describe, expect, it, vi } from 'vitest';
import { reviewRecord } from '../src/index.ts';
import { makeFixture } from '../../scripts/review-fixture.ts';

vi.setConfig({ testTimeout: 240_000 });

describe.skipIf(!process.env.REVIEW_GATE)('the 60 s gate', () => {
  it('reviews a 300-decision game within 60 s, every unfinished item a marker', () => {
    const f = makeFixture();
    expect(f.decisions).toBeGreaterThanOrEqual(300);
    const t0 = performance.now();
    const r = reviewRecord(f.record, f.cards, { seats: ['p1'] });
    expect(performance.now() - t0).toBeLessThan(60_000);
    const ran = Object.values(r.phaseItems).reduce((a, b) => a + b, 0);
    if (ran < r.plan.items.length)
      expect(r.markers.some((m) => m.reason === 'deadline')).toBe(true);
  });
});
