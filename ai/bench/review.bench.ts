/**
 * Vitest bench of the review pipeline on the 300-decision fixture (M8 WP1): `npm run bench`. One
 * iteration each (a review of this game takes tens of seconds); `ai/bench/review.ts` prints the phase
 * split and the marker rate.
 */
import { bench, describe } from 'vitest';
import { reviewRecord } from '../src/index.ts';
import { makeFixture } from '../../scripts/review-fixture.ts';

const fixture = makeFixture();

describe(`review of a ${fixture.decisions}-decision game (seed ${fixture.seed}), one seat`, () => {
  bench(
    'wall-clock caps, 55 s deadline (the app, one worker)',
    () => {
      reviewRecord(fixture.record, fixture.cards, { seats: ['p1'] });
    },
    { iterations: 1, warmupIterations: 0, time: 0, warmupTime: 0 },
  );
  bench(
    'node cap 20,000 (deterministic, as the tests run it)',
    () => {
      reviewRecord(fixture.record, fixture.cards, { seats: ['p1'], nodes: 20_000 });
    },
    { iterations: 1, warmupIterations: 0, time: 0, warmupTime: 0 },
  );
});
