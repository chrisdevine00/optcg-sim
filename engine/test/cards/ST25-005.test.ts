/** ST25-005 Mohji. */
import { describe, expect, it } from 'vitest';
import {
  BUGGY_LEADER,
  canBlockWith,
  costOf,
  dec,
  expectDecision,
  hand,
  koByEffect,
  mk,
  NOT_BUGGY_LEADER,
  p2Attacks,
  PLAIN_BLUE,
  raiseCost,
  V,
} from './helpers-lfc.ts';

const ID = 'ST25-005';

describe('ST25-005 Mohji', () => {
  it('with 2 Characters of base cost 5 or more: [Blocker] and +1 cost (4 becomes 5)', () => {
    const g = mk({ characters: [ID, V.c5, V.c6] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(5);
  });

  it('boundary: with 1 such Character (or 2 of base cost 4) neither applies; base cost only', () => {
    for (const chars of [[V.c5], [V.c5, V.c4], []]) {
      const g = mk({ characters: [ID, ...chars] });
      expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
      expect(costOf(g, 'p1', ID)).toBe(4);
    }
    const g = mk({ characters: [ID, V.c5, V.c4] });
    raiseCost(g, g.find('p1', 'characters', V.c4), 1);
    expect(costOf(g, 'p1', ID)).toBe(4);
  });

  it('the granted [Blocker] can block; without the condition he cannot', () => {
    const on = p2Attacks({ leader: PLAIN_BLUE, characters: [ID, V.c5, V.c6] }, V.c7);
    expect(canBlockWith(on, on.find('p1', 'characters', ID))).toBe(true);
    const off = p2Attacks({ leader: PLAIN_BLUE, characters: [ID] }, V.c7);
    expect(canBlockWith(off, off.find('p1', 'characters', ID))).toBe(false);
  });

  it('[On K.O.] with a [Buggy] Leader and 3 or less cards in hand: draws 1 (boundary 3 yes, 4 no)', () => {
    const three = mk({ leader: BUGGY_LEADER, characters: [ID], hand: [V.c1, V.c2, V.c3] }, {}, {});
    koByEffect(three, 'p1', ID);
    expect(hand(three, 'p1')).toHaveLength(4);
    const four = mk({ leader: BUGGY_LEADER, characters: [ID], hand: [V.c1, V.c2, V.c3, V.c4] });
    koByEffect(four, 'p1', ID);
    expect(hand(four, 'p1')).toHaveLength(4);
    const empty = mk({ leader: BUGGY_LEADER, characters: [ID], hand: [] });
    koByEffect(empty, 'p1', ID);
    expect(hand(empty, 'p1')).toHaveLength(1);
  });

  it("must not draw without a [Buggy] Leader, nor when only a different Character is K.O.'d", () => {
    const g = mk({ leader: NOT_BUGGY_LEADER, characters: [ID], hand: [V.c1] });
    koByEffect(g, 'p1', ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    const h = mk({ leader: BUGGY_LEADER, characters: [ID, V.c2], hand: [V.c1] });
    koByEffect(h, 'p1', V.c2);
    expect(hand(h, 'p1')).toEqual([V.c1]);
    expect(expectDecision(h, 'main').kind).toBe('main');
    expect(dec(h)?.kind).toBe('main');
  });
});
