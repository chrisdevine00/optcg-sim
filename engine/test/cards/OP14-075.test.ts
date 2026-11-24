/** OP14-075 Lao.G. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, none, pick, V } from './helpers.ts';
import { DP_LEADER, koedInBattle } from './helpers-op14g3.ts';

const ID = 'OP14-075';

describe('OP14-075 Lao.G', () => {
  const ko = (opp: string[], donDeck?: number) =>
    koedInBattle(
      ID,
      { leader: DP_LEADER, costArea: { active: donDeck === 0 ? 10 : 0, rested: 0 }, donDeck },
      { characters: opp },
    );

  it("[On K.O.] add up to 1 DON!! rested, then give up to 1 of your opponent's Characters -2000 power during this turn", () => {
    const g = ko([V.c1, V.c2]);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(2000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('only Characters of your opponent are targets (not their Leader, not yours)', () => {
    const g = ko([V.c1]);
    addMost(g);
    const picks = g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
    const theirs = g.zone('p2', 'characters').map((c) => c.instance);
    expect(picks.sort()).toEqual(theirs.sort()); // the V.c1 and the attacker; no Leader, none of p1's
    expect(picks).toHaveLength(2);
  });

  it('"up to 1": may choose nothing', () => {
    const g = ko([V.c1]);
    addMost(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('"Then" is sequential: with an empty DON!! deck the power is still given', () => {
    const g = ko([V.c1], 0);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(1000);
  });

  it('the -2000 ends with the turn', () => {
    const g = ko([V.c1]);
    addMost(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(1000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });
});
