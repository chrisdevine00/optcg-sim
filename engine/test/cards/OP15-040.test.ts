/** OP15-040 Viola. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { DR, DR_EVENT, EB, mk } from './helpers-op15g1.ts';

const ID = 'OP15-040';

describe('OP15-040 Viola', () => {
  const start = (top: string[]) => mk({ hand: [ID], deck: [...top, ...times(6, BLUE)] });

  it('[On Play]: reveals up to 1 {Dressrosa} card from the top 3 into your hand; the rest go to the bottom', () => {
    const g = start([EB.c1, DR.c2, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', DR.c2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DR.c2]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(8);
    expect(deck.slice(0, 6)).toEqual(times(6, BLUE));
    expect(deck.slice(6).sort()).toEqual([EB.c1, V.c1].sort());
  });

  it('a {Dressrosa} Event counts, a card of another type does not', () => {
    const g = start([DR_EVENT, EB.c1, V.c1]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', DR_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DR_EVENT]);
  });

  it('boundary: only the top 3 are looked at (a {Dressrosa} card in 4th place is left)', () => {
    const g = start([EB.c1, V.c1, V.c2, DR.c2]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('"up to 1": may take nothing, even with a {Dressrosa} card available', () => {
    const g = start([DR.c2, DR.c3, V.c1]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(6)
        .map((c) => c.card)
        .sort(),
    ).toEqual([DR.c2, DR.c3, V.c1].sort());
  });

  it('only 1 card may be taken even with several candidates', () => {
    const g = start([DR.c2, DR.c3, DR.c5]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', DR.c3)]);
    expectDecision(g, 'order', 'p1');
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([DR.c3]);
  });
});
