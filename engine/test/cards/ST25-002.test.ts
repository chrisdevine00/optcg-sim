/** ST25-002 Cabaji. */
import { describe, expect, it } from 'vitest';
import {
  canBlockWith,
  costOf,
  expectDecision,
  mk,
  opp,
  p2Attacks,
  PLAIN_BLUE,
  raiseCost,
  V,
} from './helpers-lfc.ts';

const ID = 'ST25-002';

describe('ST25-002 Cabaji', () => {
  const view = (chars: string[], extra: Parameters<typeof mk>[2] = {}) => {
    const g = mk({ characters: [ID, ...chars] }, {}, extra);
    return g.card(g.find('p1', 'characters', ID));
  };

  it('with 2 Characters of base cost 5 or more: [Blocker] and +1 cost (4 becomes 5)', () => {
    const c = view([V.c5, V.c6]);
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(5);
  });

  it('boundary: with 1 such Character (or 2 of base cost 4) she has neither [Blocker] nor the cost; she never counts herself', () => {
    for (const chars of [[V.c5], [V.c5, V.c4], [V.c4, V.c4], []]) {
      const c = view(chars);
      expect(c.keywords).not.toContain('Blocker');
      expect(c.cost).toBe(4);
    }
  });

  it('only base cost counts: a Character raised to cost 5 by an effect does not', () => {
    const g = mk({ characters: [ID, V.c5, V.c4] });
    raiseCost(g, g.find('p1', 'characters', V.c4), 1);
    expect(costOf(g, 'p1', ID)).toBe(4);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it("[Opponent's Turn]: +5000 power on the opponent's turn only (1000 becomes 6000)", () => {
    const mine = view([], {});
    expect(mine.power).toBe(1000);
    const theirs = view([], opp);
    expect(theirs.power).toBe(6000);
  });

  it('the granted [Blocker] can block an attack; without the condition she cannot', () => {
    const on = p2Attacks({ leader: PLAIN_BLUE, characters: [ID, V.c5, V.c6] }, V.c7);
    expectDecision(on, 'block', 'p1');
    expect(canBlockWith(on, on.find('p1', 'characters', ID))).toBe(true);
    const off = p2Attacks({ leader: PLAIN_BLUE, characters: [ID, V.c5] }, V.c7);
    expectDecision(off, 'block', 'p1');
    expect(canBlockWith(off, off.find('p1', 'characters', ID))).toBe(false);
  });
});
