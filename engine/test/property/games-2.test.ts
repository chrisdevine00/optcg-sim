import { describe, it } from 'vitest';
import { newTally, runGames, TOTAL_GAMES, PARTS } from './games.ts';

describe('random legal games, part 2 of 4', () => {
  it(`plays ${Math.ceil(TOTAL_GAMES / PARTS)} games: invariants, replay hash, listed and unlisted actions`, () => {
    const tally = newTally();
    runGames(2, tally);
    console.info('[engine property part 2]', JSON.stringify(tally));
  }, 600_000);
});
