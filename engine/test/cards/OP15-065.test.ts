/** OP15-065 Goro. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, hand, option, play, V } from './helpers.ts';
import { mine, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-065';

describe('OP15-065 Goro', () => {
  const start = (deck: string[], extra: { donDeck?: number } = {}) =>
    mine(OTHER_LEADER, { hand: [ID], deck, ...extra }, {}, 3);

  it('[On Play] top card has a cost of 2: add 1 DON!! from the DON!! deck, rested', () => {
    const g = start([V.c2, V.c1, V.c1]);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it('cost 1 also qualifies ("2 or less")', () => {
    const g = start([V.c1, V.c1, V.c1]);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 4, deck: 6 });
  });

  it('cost 3 does not: nothing is added and nothing is asked', () => {
    const g = start([V.c3, V.c1, V.c1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ rested: 3, deck: 7 });
  });

  it('the revealed card stays on top of the deck and nothing is drawn', () => {
    const g = start([V.c2, V.c1, V.c1]);
    play(g, ID);
    addMost(g);
    expect(g.zone('p1', 'deck')[0]?.card).toBe(V.c2);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": the count may be 0', () => {
    const g = start([V.c2, V.c1, V.c1]);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, deck: 7 });
  });

  it('with an empty DON!! deck nothing can be added', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c2, V.c1, V.c1], donDeck: 0 }, {}, 10);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });
});
