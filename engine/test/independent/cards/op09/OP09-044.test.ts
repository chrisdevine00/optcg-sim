/**
 * OP09-044 Izo (Character, Blue, cost 3, 4000, Counter +1000, {Land of Wano}/{Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] Look at 5 cards from the top of your deck; reveal up to 1 "Land of Wano"
 * type card or card with a type including "Whitebeard Pirates" and add it to your hand. Then, place
 * the rest at the bottom of your deck in any order and trash 1 card from your hand."
 *
 * Rules: CR 10-2-5 ([When Attacking]), CR 8-4-4 ("up to"), CR 2-4-3-1 (a type "including" the text
 * matches {Former Whitebeard Pirates} and {Whitebeard Pirates Allies}).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  deckTop,
  describeLookTrash,
  hand,
  kind,
  L9,
  mine,
  need,
  offeredIds,
  pickCards,
  settleOrders,
  playId,
  theirs,
  trash,
  V9,
} from './kit-op09b.ts';

const IZO = 'OP09-044';

const start = (top: string[], extra: string[]) => {
  const g = mine(L9.neutral, { characters: [IZO], hand: extra, deck: top });
  attack(g, at(g, 'p1', 'characters', IZO), g.leader('p2'));
  return g;
};

describeLookTrash({
  id: IZO,
  n: 5,
  after: 'block',
  start,
  match: [V9.c5, V9.wano6],
  multi: V9.wano1,
  miss: V9.c4,
  fodder: V9.c2,
});

describe('OP09-044 Izo: the filter is {Land of Wano} or a type including "Whitebeard Pirates"', () => {
  it('offers {Land of Wano}, {Whitebeard Pirates}, {Former Whitebeard Pirates} and {Whitebeard Pirates Allies}, not other types', () => {
    const g = start(deckTop([V9.c4, V9.wano6, V9.c3, V9.doma, V9.c5]), [V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.wano6, V9.c3, V9.doma, V9.c5].sort());
  });

  it('a card with {Land of Wano} among several types qualifies', () => {
    const g = start(deckTop([V9.wano1, V9.c4, V9.c4, V9.c4, V9.c4]), [V9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.wano1]);
  });

  it('the attack goes on after the effect: the opponent then owes a Block Step decision on the same attack', () => {
    const g = start(deckTop([V9.c5, V9.c4, V9.c4, V9.c4, V9.c4]), [V9.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [V9.c5]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [V9.c2]);
    need(g, 'block', 'p2');
    expect(kind(g)).toBe('block');
  });

  it('must not fire when Izo is played: [When Attacking] only', () => {
    const g = mine(L9.neutral, { hand: [IZO, V9.c2], deck: deckTop([V9.c5, V9.wano6]) });
    playId(g, IZO);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.c2]);
    expect(trash(g)).toEqual([]);
  });

  it('must not fire when the opponent attacks (Izo blocks): no look, no trash', () => {
    const g = theirs(
      L9.neutral,
      { characters: [IZO], hand: [V9.c2], deck: deckTop([V9.c5]) },
      {
        characters: [V9.c1],
      },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(hand(g)).toEqual([V9.c2]);
    expect(trash(g)).toEqual([]);
  });
});
