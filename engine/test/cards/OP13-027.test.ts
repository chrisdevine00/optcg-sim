/** OP13-027 Sanji. */
import { describe, expect, it } from 'vitest';
import { don, game, play } from './helpers.ts';
import { PLAIN_BLUE, RGL } from './helpers-rgl-penel.ts';

describe('OP13-027 Sanji', () => {
  it('[On Play]: sets up to 2 DON!! active', () => {
    const g = game(
      { leader: RGL, hand: ['OP13-027'], costArea: { active: 5, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP13-027');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 6 });
  });

  const endTurn = (leader: string) => {
    const g = game(
      { leader, characters: ['OP13-027'], costArea: { active: 0, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    return g;
  };

  it('[End of Your Turn]: with a {Straw Hat Crew} Leader, sets up to 1 DON!! active', () => {
    expect(don(endTurn(RGL), 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('[End of Your Turn]: with a Leader of neither type, nothing happens', () => {
    expect(don(endTurn(PLAIN_BLUE), 'p1')).toMatchObject({ active: 0, rested: 3 });
  });
});
