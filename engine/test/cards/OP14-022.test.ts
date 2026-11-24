/** OP14-022 Usopp. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, option, setMost } from './helpers.ts';
import { PLAIN_BLUE, RGL } from './helpers-rgl-penel.ts';

describe('OP14-022 Usopp', () => {
  const endTurn = (leader: string, rested = 3) => {
    const g = game(
      { leader, characters: ['OP14-022'], costArea: { active: 0, rested } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    if (rested > 0 && leader === RGL) setMost(g);
    return g;
  };

  it('[End of Your Turn]: with a {Straw Hat Crew} Leader, sets up to 2 DON!! active', () => {
    expect(don(endTurn(RGL), 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('sets only the DON!! it can ("up to")', () => {
    expect(don(endTurn(RGL, 1), 'p1')).toMatchObject({ active: 1, rested: 0 });
  });

  it('"up to 2": the player is asked a count and may set fewer or none (OP14-R2)', () => {
    const g = game(
      { leader: RGL, characters: ['OP14-022'], costArea: { active: 0, rested: 3 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    expect(expectDecision(g, 'choose', 'p1').options!.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('with a Leader of neither type, nothing happens', () => {
    expect(don(endTurn(PLAIN_BLUE), 'p1')).toMatchObject({ active: 0, rested: 3 });
  });
});
