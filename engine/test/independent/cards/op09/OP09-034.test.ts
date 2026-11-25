/**
 * OP09-034 Perona (Character, Green, cost 1, 2000, Counter +2000, {Thriller Bark Pirates}/{Muggy Kingdom}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Dracule Mihawk] or
 * "Thriller Bark Pirates" type card and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order and trash 1 card from your hand."
 *
 * Rules: CR 8-4-4 ("up to"), CR 11-2-1 (revealed cards are shown), CR 2-4-3-1 (a quoted type matches
 * any card whose types include it), a card name in brackets matches by name.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  deck,
  deckTop,
  describeLookTrash,
  hand,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  settleOrders,
  trash,
  V9,
} from './kit-op09b.ts';

const PERONA = 'OP09-034';
const MIHAWK_CG = 'OP09-048';

const start = (top: string[], extra: string[]) => {
  const g = mine(L9.neutral, { hand: [PERONA, ...extra], deck: top });
  playId(g, PERONA);
  return g;
};

describeLookTrash({
  id: PERONA,
  n: 5,
  after: 'main',
  start,
  match: [V9.lola4, V9.mihawk9],
  multi: V9.moria4,
  miss: V9.c4,
  fodder: V9.c2,
});

describe('OP09-034 Perona: the filter is [Dracule Mihawk] by name or {Thriller Bark Pirates} by type', () => {
  it('a differently typed card that is named [Dracule Mihawk] is offered (OP09-048 is {Cross Guild}), and so is a {Thriller Bark Pirates} card', () => {
    const g = start(deckTop([MIHAWK_CG, V9.lola4, V9.c4, V9.c5, V9.c6]), [V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MIHAWK_CG, V9.lola4].sort());
  });

  it('a card of neither the name nor the type is not offered: Hajrudin {Giant}, Marco {Former Whitebeard Pirates}', () => {
    const g = start(deckTop([V9.c4, V9.c3, V9.lola4, V9.c5, V9.c6]), [V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.lola4]);
  });

  it('the played Perona does not stay in hand and is not a candidate for the trash', () => {
    const g = start(deckTop([V9.lola4, V9.c4, V9.c5, V9.c6, V9.c8]), [V9.c2]);
    pickCards(g, [V9.lola4]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c2, V9.lola4].sort());
    pickCards(g, [V9.lola4]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.c2]);
    expect(trash(g)).toEqual([V9.lola4]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PERONA]);
  });

  it('the looked-at cards leave the top: the next draw is the card below them', () => {
    const g = start([V9.lola4, V9.c4, V9.c5, V9.c6, V9.c8, V9.c7, BLUE, BLUE], [V9.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [V9.lola4]);
    settleOrders(g, 'p1');
    pickCards(g, [V9.c2]);
    expect(deck(g)[0]).toBe(V9.c7);
  });
});
