/** OP11-071 Charlotte Perospero. */
import { describe, expect, it } from 'vitest';
import { addMost, BLUE, don, hand, pick, trash, V } from './helpers.ts';
import { activate, atMain, mine, nameCost, offeredAb, revealGame } from './helpers-w5c2.ts';

const ID = 'OP11-071';
const mk = (top: string = V.c3, h: string[] = [V.c1, V.c2]) =>
  revealGame({ characters: [ID], hand: h, deck: [V.c5, V.c6, BLUE] }, {}, top);
const go = (g: ReturnType<typeof mk>, trashed: string = V.c1) => {
  activate(g, mine(g, ID), 'choose-cost');
  pick(g, [g.find('p1', 'hand', trashed)]);
};

describe('OP11-071 Charlotte Perospero', () => {
  it('[Activate: Main]: trash 1 card, name the revealed cost: draw 1 and add 1 DON!! as active', () => {
    const g = mk(V.c3);
    const before = don(g, 'p1');
    go(g);
    nameCost(g, 3);
    addMost(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    // Hand: 2 - 1 trashed + 1 drawn (the top of p1's own deck, not the revealed card).
    expect(hand(g, 'p1')).toEqual([V.c2, V.c5]);
    expect(don(g, 'p1')).toMatchObject({ active: before.active + 1, rested: before.rested });
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    expect(g.zone('p2', 'deck')).toHaveLength(10);
  });

  it('a miss: the card is still trashed, nothing is drawn or added, nothing more is asked', () => {
    const g = mk(V.c3);
    const before = don(g, 'p1');
    go(g);
    nameCost(g, 2);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(don(g, 'p1')).toEqual(before);
  });

  it('chooses which card to trash (the cost), and takes exactly one', () => {
    const g = mk(V.c3, [V.c1, V.c2, V.c4]);
    go(g, V.c2);
    nameCost(g, 9);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c4]);
  });

  it('[Once Per Turn]: spent by a match and by a miss alike', () => {
    for (const named of [3, 4]) {
      const g = mk(V.c3, [V.c1, V.c2, V.c4]);
      go(g);
      nameCost(g, named);
      if (!atMain(g)) addMost(g);
      expect(offeredAb(g, mine(g, ID), 'choose-cost')).toBe(false);
    }
  });

  it('is not offered with an empty hand (the trash is its cost)', () => {
    const g = mk(V.c3, []);
    expect(offeredAb(g, mine(g, ID), 'choose-cost')).toBe(false);
  });

  it('with an empty opponent deck nothing is revealed and no cost matches', () => {
    const g = revealGame({ characters: [ID], hand: [V.c1], deck: [V.c5, V.c6] }, { deck: [] });
    go(g);
    nameCost(g, 0);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });
});
