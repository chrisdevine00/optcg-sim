/**
 * OP11-048 Capone"Gang"Bege (Blue Character, cost 1, 2000, Counter +1000, {Firetank Pirates}/
 * {Supernovas}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 {Firetank Pirates} or
 * {Straw Hat Crew} type card with a cost of 2 or more and add it to your hand. Then, place the rest
 * at the bottom of your deck in any order."
 *
 * Rules: "card" (not "Character") so Events qualify; the cost filter is printed cost 2 or more; a
 * quoted type is matched exactly. Up to 1 may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  C11,
  describeLook,
  E11,
  fill,
  BLUE,
  hand,
  L11,
  mine,
  need,
  offeredIds,
  pickInst,
  playCard,
  settleOrders,
  choices,
  cardOf,
} from './kit-op11b.ts';

const BEGE = 'OP11-048';

const start = (deckTop: string[]) => {
  const g = mine(L11.mono, { hand: [BEGE], deck: deckTop });
  playCard(g, BEGE);
  return g;
};

describeLook({
  id: BEGE,
  n: 4,
  start,
  match: [C11.fire3, C11.shc2],
  miss: C11.c3,
  notOffered: [
    { card: C11.shc1, why: 'a {Straw Hat Crew} Character with cost 1 is below the cost of 2' },
    { card: C11.fishman2, why: 'a cost-2 Character of an unrelated type does not qualify' },
  ],
  rest: 'bottom',
});

describe('OP11-048 Capone"Gang"Bege: more cases', () => {
  it('an Event with the {Straw Hat Crew} type and cost 3 qualifies (the text says card, not Character)', () => {
    const g = start([E11.culverin61, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 10)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([E11.culverin61]);
    pickInst(g, [choices(g)[0]!]);
    settleOrders(g);
    expect(hand(g)).toEqual([E11.culverin61]);
  });

  it('a {Firetank Pirates} card with cost 1 (Bege himself) is not offered', () => {
    const g = start([BEGE, C11.fire5, C11.c3, C11.c3, ...fill(BLUE, 10)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.fire5]);
    expect(choices(g).map((c) => cardOf(g, c))).not.toContain(BEGE);
  });
});
