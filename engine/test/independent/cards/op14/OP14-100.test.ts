/**
 * OP14-100 Absalom (Character, Yellow, cost 3, 5000, no Counter, {Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] Look at 3 cards from the top of your deck; reveal up to 1 {Thriller Bark Pirates}
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 10-2-17, CR 8-4-4 ("up to", "look at"), CR 11-2-1 (reveal), CR 3-1-7 (owner orders).
 * "{Thriller Bark Pirates} type card" is any category: Stages and Events qualify.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  deck,
  deckTop,
  describeLook,
  describeTbTrigger,
  LD14,
  need,
  offeredIds,
  SC14,
  settleOrders,
  TB,
  theirs,
  theyKo,
  trash,
} from './kit-op14d.ts';
import { BLUE } from './kit-op14d.ts';

const ID = 'OP14-100';

function koedWithDeck(top: string[]) {
  const g = theirs(
    LD14.neutral,
    { characters: [{ card: ID, rested: true }], hand: [], deck: top },
    {},
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describeLook({
  id: ID,
  n: 3,
  main: 'p2',
  rest: 'bottom',
  start: koedWithDeck,
  match: [TB.lola4, TB.perona4],
  multi: TB.moria4,
  miss: SC14.c2,
});

describe('OP14-100 Absalom: [On K.O.] any {Thriller Bark Pirates} CARD may be taken', () => {
  it('a {Thriller Bark Pirates} Event and a Stage are offered together with a Character; a plain card is not', () => {
    const g = koedWithDeck([
      TB.kingEvent,
      TB.stage,
      SC14.c2,
      ...Array.from({ length: 6 }, () => BLUE),
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TB.kingEvent, TB.stage].sort());
  });

  it('the two cards that are not taken go to the BOTTOM (not the trash), the 4th card is now on top', () => {
    const g = koedWithDeck(deckTop([TB.lola4, SC14.c2, SC14.c4, SC14.c5]));
    need(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: g.zone('p1', 'deck')[0]!.instance });
    settleOrders(g, 'p1');
    expect(deck(g)[0]).toBe(SC14.c5);
    expect(deck(g).slice(-2).sort()).toEqual([SC14.c2, SC14.c4].sort());
    expect(trash(g)).toEqual([ID]);
  });
});

describeTbTrigger(ID);
