/** ST25-001 Alvida. */
import { describe, expect, it } from 'vitest';
import {
  BUGGY_LEADER,
  CG2,
  costOf,
  dec,
  expectDecision,
  hand,
  mk,
  NOT_BUGGY_LEADER,
  pick,
  play,
  raiseCost,
  trash,
  V,
} from './helpers-lfc.ts';

const ID = 'ST25-001';

describe('ST25-001 Alvida', () => {
  const cost = (chars: string[], p2chars: string[] = []) => {
    const g = mk({ characters: [ID, ...chars] }, { characters: p2chars });
    return costOf(g, 'p1', ID);
  };

  it('with 2 Characters of base cost 5 or more she gains +1 cost (4 becomes 5)', () => {
    expect(cost([V.c5, V.c6])).toBe(5);
    expect(cost([V.c7, V.c5, V.c1])).toBe(5);
  });

  it('boundary: 1 such Character, or 2 of base cost 4, give no bonus; she never counts herself (base cost 4)', () => {
    expect(cost([V.c5])).toBe(4);
    expect(cost([V.c5, V.c4])).toBe(4);
    expect(cost([])).toBe(4);
  });

  it("only base cost counts: a Character raised to cost 5 by an effect does not, and the opponent's Characters do not", () => {
    const g = mk({ characters: [ID, V.c5, V.c4] });
    raiseCost(g, g.find('p1', 'characters', V.c4), 1);
    expect(g.card(g.find('p1', 'characters', V.c4)).cost).toBe(5);
    expect(costOf(g, 'p1', ID)).toBe(4);
    expect(cost([V.c5], [V.c6, V.c7])).toBe(4);
  });

  it('[On Play] with a [Buggy] Leader: draws 3, then trashes exactly 2 cards from the hand', () => {
    const g = mk({ leader: BUGGY_LEADER, hand: [ID, V.c1, V.c2] });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(5);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(2);
    expect(d.min).toBe(2);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
  });

  it('must not fire without a [Buggy] Leader: no draw, no prompt', () => {
    const g = mk({ leader: NOT_BUGGY_LEADER, hand: [ID, V.c1] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('with a one-card hand left after drawing nothing is lost: she draws 3 and trashes 2 of 3 cards', () => {
    const g = mk({ leader: BUGGY_LEADER, hand: [ID], deck: [CG2, V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([CG2, V.c1, V.c2]);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([CG2]);
  });
});
