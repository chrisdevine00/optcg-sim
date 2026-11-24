/** OP17-032 Limejuice. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, PLAIN_BLUE, pick, play } from './helpers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { OTHER_LEADER, RHP_4, RHP_5 } from './helpers-op17g2.ts';

const ID = 'OP17-032';
/** OP17-026 Fugar: its type is {Red-Haired Pirates Allies}, which "includes" Red-Haired Pirates. */
const ALLIES = 'OP17-026';

describe('OP17-032 Limejuice', () => {
  const start = (deck: string[]) =>
    game(
      { leader: OTHER_LEADER, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: look at 3, add up to 1 card with a type including "Red-Haired Pirates", the rest go to the bottom', () => {
    const g = start([BLUE, RHP_4, BLUE, RHP_5, BLUE, BLUE]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Only the RHP card among the 3 looked at is offered, not the 4th card.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', RHP_4)]);
    expect(hand(g, 'p1')).toEqual([RHP_4]);
    finishOrder(g);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(RHP_5);
    expect(deck.slice(-2)).toEqual([BLUE, BLUE]);
    expect(deck).toHaveLength(5);
  });

  it('a type that merely includes the words ({Red-Haired Pirates Allies}) qualifies', () => {
    const g = start([ALLIES, BLUE, BLUE, BLUE]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ALLIES)]);
    expect(hand(g, 'p1')).toEqual([ALLIES]);
  });

  it('"up to 1": may add nothing, all 3 go to the bottom', () => {
    const g = start([RHP_4, BLUE, BLUE, RHP_5]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP_5);
  });

  it('with no qualifying card among the 3 nothing can be added', () => {
    const g = start([BLUE, BLUE, BLUE, RHP_4]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1'); // the look is shown, with nothing to take
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP_4);
  });
});
