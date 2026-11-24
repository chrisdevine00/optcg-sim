/** OP14-042 Arlong. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, none, pick, play, V } from './helpers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { canPick, FM_LEADER, OTHER_LEADER, mine } from './helpers-op14g2.ts';

const ID = 'OP14-042';

const start = (leader: string, deck: string[]) =>
  mine(leader, { hand: [ID], deck, costArea: { active: 1, rested: 0 } });

describe('OP14-042 Arlong', () => {
  it('with a {Fish-Man} Leader: looks at 4, adds a card with cost 2 or more, the rest go to the bottom', () => {
    const g = start(FM_LEADER, [V.c1, V.c3, V.c2, BLUE, V.c5, V.c6]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(true); // cost 2: boundary in
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // cost 1: out
    expect(canPick(g, g.find('p1', 'deck', V.c5))).toBe(false); // the 5th card is not looked at
    pick(g, [g.find('p1', 'deck', V.c3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([V.c5, V.c6]); // unseen cards stay on top
    expect(deck).toHaveLength(5);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, BLUE].sort()); // the other 3 at the bottom
  });

  it('"up to 1": it may add nothing; all 4 looked-at cards go to the bottom', () => {
    const g = start(FM_LEADER, [V.c3, V.c2, V.c4, V.c5, V.c6]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c6);
  });

  it('with no card of cost 2 or more among the 4, nothing can be added', () => {
    const g = start(FM_LEADER, [V.c1, BLUE, V.c1, BLUE, V.c6]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('without a {Fish-Man} Leader: nothing happens and the deck is untouched', () => {
    const g = start(OTHER_LEADER, [V.c3, V.c2, V.c4, V.c5, V.c6]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
