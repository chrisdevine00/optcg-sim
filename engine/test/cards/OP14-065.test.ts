/** OP14-065 Senor Pink. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, payDon } from './helpers.ts';
import { DP_LEADER, koedInBattle } from './helpers-op14g3.ts';

const ID = 'OP14-065';

describe('OP14-065 Senor Pink', () => {
  const ko = (p2Don: { active: number; rested: number }) =>
    koedInBattle(
      ID,
      { leader: DP_LEADER, costArea: { active: 3, rested: 0 } },
      { costArea: p2Don },
    );

  it('[On K.O.] your opponent returns 1 DON!! from their field to their DON!! deck, and chooses which', () => {
    const g = ko({ active: 2, rested: 1 });
    expectDecision(g, 'choose', 'p2');
    payDon(g);
    expect(don(g, 'p2').deck).toBe(8);
    expect(don(g, 'p2').active + don(g, 'p2').rested).toBe(2);
  });

  it('it is not a cost: the opponent has no choice to decline', () => {
    const g = ko({ active: 1, rested: 0 });
    expect(dec(g)?.kind).not.toBe('optional');
    if (dec(g)?.kind === 'choose') payDon(g);
    expect(don(g, 'p2').deck).toBe(10);
  });

  it('with no DON!! on their field nothing happens', () => {
    const g = ko({ active: 0, rested: 0 });
    expect(don(g, 'p2').deck).toBe(10);
    expect(dec(g)?.kind).not.toBe('choose');
  });

  it('only one is returned, and your own DON!! stay', () => {
    const g = ko({ active: 3, rested: 3 });
    payDon(g);
    expect(don(g, 'p2').deck).toBe(5);
    expect(don(g, 'p1')).toMatchObject({ active: 3, deck: 7 });
  });

  it('a rested DON!! may be the one returned', () => {
    const g = ko({ active: 0, rested: 2 });
    payDon(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 1, deck: 9 });
  });
});
