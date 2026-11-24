/** OP13-071 Nekomamushi. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { boost } from './helpers-op15g1.ts';
import { canPick, idsOf, mine, OTHER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-071';

describe('OP13-071 Nekomamushi', () => {
  const start = (active: number, opp: string[], given = 0) =>
    mine(
      { leader: given ? withDon(OTHER_LEADER, given) : OTHER_LEADER, hand: [ID] },
      { characters: opp },
      active,
    );

  it('[On Play] with 8 or more DON!! on your field: K.O. up to 1 opposing Character with 3000 base power or less', () => {
    const g = start(8, [V.c1, V.c2]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('boundary: 7 DON!! on the field does nothing (no prompt)', () => {
    const g = start(7, [V.c1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('rested and given DON!! count: 4 active (3 rested by the cost) + 4 given = 8', () => {
    const g = start(4, [V.c1], 4);
    play(g, ID);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('reads BASE power: a 3000-base Character boosted to 5000 is a target, a 4000-base one lowered to 3000 is not', () => {
    const g = start(8, [V.c1, V.c2]);
    boost(g, g.find('p2', 'characters', V.c1), 2000);
    boost(g, g.find('p2', 'characters', V.c2), -1000);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start(8, [V.c1]);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });
});
