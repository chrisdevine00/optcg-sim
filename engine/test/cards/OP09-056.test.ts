/** OP09-056 Mr.3(Galdino). */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { BW5, canPick, CG5, FBW5, mk, settle } from './helpers-a09g2.ts';

const ID = 'OP09-056';

describe('OP09-056 Mr.3(Galdino)', () => {
  it('[On Play]: adds a {Cross Guild} card to your hand; the other 3 go to the bottom in any order', () => {
    const g = mk({ hand: [ID], deck: [V.c1, CG5, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', CG5)]);
    expect(hand(g, 'p1')).toEqual([CG5]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('selectable: {Cross Guild} or a type including "Baroque Works"; another [Mr.3(Galdino)] is excluded', () => {
    const g = mk({ hand: [ID], deck: [CG5, BW5, FBW5, ID, V.c1, V.c2] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', CG5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', BW5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FBW5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false); // another [Mr.3(Galdino)]
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('looks only at the top 4: a matching card in 5th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, CG5] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('"up to 1": two cards cannot both be taken; taking nothing sends all 4 to the bottom', () => {
    const g = mk({ hand: [ID], deck: [CG5, BW5, V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'deck', CG5), g.find('p1', 'deck', BW5)])).toThrow(
      /can be picked now/,
    );
    const h = mk({ hand: [ID], deck: [CG5, BW5, V.c1, V.c2, V.c3] });
    play(h, ID);
    none(h);
    settle(h);
    expect(hand(h, 'p1')).toEqual([]);
    expect(h.zone('p1', 'deck')).toHaveLength(5);
    expect(h.zone('p1', 'deck')[0]!.card).toBe(V.c3);
  });
});
