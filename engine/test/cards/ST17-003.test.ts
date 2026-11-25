/** ST17-003 Buggy. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { BLUE, dec, expectDecision, hand, play, times, V } from './helpers.ts';
import { cardsIn, mk, orderAll } from './helpers-prbst.ts';

const ID = 'ST17-003';

describe('ST17-003 Buggy', () => {
  const deck = [V.c1, V.c2, V.c3, V.c4, V.c5, ...times(3, BLUE)];
  const start = () => mk({ hand: [ID], deck });

  it('[On Play]: looks at 3 cards (only the controller sees them) and puts them back on top', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'order', 'p1');
    const mine = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(mine.looking.map((c) => c.card).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    const theirs = project(g.state, 'p2') as unknown as { looking: unknown[] };
    expect(theirs.looking).toEqual([]);
    orderAll(g);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(deck.length);
    expect(d.slice(0, 3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(d.slice(3)).toEqual([V.c4, V.c5, ...times(3, BLUE)]); // the 4th card was not looked at
  });

  it('the order is chosen by the player: another order than the printed one is possible', () => {
    const g = start();
    play(g, ID);
    const c3 = g.find('p1', 'deck', V.c3);
    const c1 = g.find('p1', 'deck', V.c1);
    const c2 = g.find('p1', 'deck', V.c2);
    for (const first of [c3, c2, c1]) {
      if (dec(g)?.kind !== 'order') break;
      g.act({ type: 'order', first });
    }
    const top3 = cardsIn(g, 'p1', 'deck').slice(0, 3);
    expect(top3.sort()).toEqual([V.c1, V.c2, V.c3].sort());
    // A different order from the default one is reachable: compare with the first-legal order.
    const h = start();
    play(h, ID);
    orderAll(h);
    const defaultTop = cardsIn(h, 'p1', 'deck').slice(0, 3);
    const chosenTop = cardsIn(g, 'p1', 'deck').slice(0, 3);
    expect(chosenTop).not.toEqual(defaultTop);
  });

  it('nothing is taken: the hand is unchanged and the deck keeps its size', () => {
    const g = start();
    play(g, ID);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(deck.length);
  });

  it('with fewer than 3 cards in the deck it looks at what there is', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    orderAll(g);
    expect(cardsIn(g, 'p1', 'deck').sort()).toEqual([V.c1, V.c2].sort());
  });
});
