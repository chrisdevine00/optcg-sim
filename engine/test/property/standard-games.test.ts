/**
 * The random-game property with random Standard-legal decks on both seats (M6b: the 36 meta lists
 * never reach most scripts or card combinations). Same checks as games.ts: invariants after every
 * action, replay hash equals live hash, every listed action reduces, sampled unlisted actions
 * throw. 60 games per push; ENGINE_GAMES sets the count (nightly: 10,000), split over four
 * tests so a run reports progress. A failure logs the seed, PROPERTY_SEED and both decks;
 * reproduce with `PROPERTY_SEED=<n>` and `standardDecksFor(seed)` (engine/test/support/decks.ts).
 */
import { describe, expect, it } from 'vitest';
import { newTally, runGames } from './games.ts';

const TOTAL = Number(process.env.ENGINE_GAMES ?? 60);
const PARTS = 4;

describe('random legal games with random Standard decks', () => {
  for (let part = 1; part <= PARTS; part++) {
    it(`part ${part} of ${PARTS}: invariants, replay hash, listed and unlisted actions`, () => {
      const tally = newTally();
      runGames(10 + part, tally, { standard: true, runs: Math.ceil(TOTAL / PARTS) });
      console.info(`[standard games part ${part}]`, JSON.stringify(tally));
      expect(tally.games).toBe(Math.ceil(TOTAL / PARTS));
    }, 3_600_000);
  }
});
