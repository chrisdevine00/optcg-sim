/** OP14-022 Usopp. */
import { describe, expect, it } from 'vitest';
import { don, game } from './helpers.ts';
import { PLAIN_BLUE, RGL } from './helpers-rgl-penel.ts';

describe('OP14-022 Usopp', () => {
  const endTurn = (leader: string, rested = 3) => {
    const g = game(
      { leader, characters: ['OP14-022'], costArea: { active: 0, rested } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    return g;
  };

  it('[End of Your Turn]: with a {Straw Hat Crew} Leader, sets up to 2 DON!! active', () => {
    expect(don(endTurn(RGL), 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('sets only the DON!! it can ("up to")', () => {
    expect(don(endTurn(RGL, 1), 'p1')).toMatchObject({ active: 1, rested: 0 });
  });

  it('with a Leader of neither type, nothing happens', () => {
    expect(don(endTurn(PLAIN_BLUE), 'p1')).toMatchObject({ active: 0, rested: 3 });
  });
});
