/** EB03-023 Kaya. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, option, play, times, V } from './helpers.ts';
import { finishOrder, mk } from './helpers-eb03g1.ts';

const ID = 'EB03-023';
const top5 = [V.c1, V.c2, V.c3, V.c4, V.c5];
const start = () => {
  const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
  play(g, ID);
  return g;
};

describe('EB03-023 Kaya', () => {
  it('[On Play]: looks at 5 and places all of them on top (in an order the owner chooses)', () => {
    const g = start();
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'top');
    finishOrder(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(10);
    expect(deck.slice(0, 5).sort()).toEqual([...top5].sort());
    expect(deck.slice(5)).toEqual(times(5, BLUE));
  });

  it('or all of them at the bottom', () => {
    const g = start();
    option(g, 'bottom');
    finishOrder(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 5)).toEqual(times(5, BLUE));
    expect(deck.slice(5).sort()).toEqual([...top5].sort());
  });

  it('takes nothing into the hand and changes no other zone', () => {
    const g = start();
    option(g, 'top');
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('boundary: a deck of fewer than 5 cards looks at what is there', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3] });
    play(g, ID);
    option(g, 'bottom');
    finishOrder(g);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expectDecision(g, 'main', 'p1');
  });

  it('does not touch the opponent deck', () => {
    const g = mk({ hand: [ID] }, { deck: top5 });
    play(g, ID);
    option(g, 'bottom');
    finishOrder(g);
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual(top5);
  });
});
