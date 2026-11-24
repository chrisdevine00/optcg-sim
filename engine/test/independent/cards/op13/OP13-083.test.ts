/**
 * OP13-083 St. Jaygarcia Saturn (Character, Black, cost 4, 5000, Counter +1000, {Celestial Dragons}/
 * {Five Elders}).
 *
 * Card text: "If you have 7 or more cards in your trash, this Character cannot be removed from the field by
 * your opponent's effects. [On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Five
 * Elders" type card and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order."
 *
 * Rules: "cannot be removed from the field" stops the opponent's effects only (QA-OP02 OP02-027),
 * CR 11-2-1 (revealing), CR 2-4-3-1 ("type" in quotes matches types including the text), "card" is any
 * category, CR 4-8-1 ("up to"). The generic tests come from `describeShield` and `describeLook`.
 * Scenery: OP13-089 Warcury and OP13-091 Mars ({Five Elders}, Characters), OP13-096 (a {Five
 * Elders} Event), OP13-085 Saint Jalmac ({Celestial Dragons} only, not a Five Elders).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  describeLook,
  describeShield,
  hand,
  LD13,
  me,
  need,
  offeredIds,
  pickCards,
  playRaw,
  S13,
  settleOrders,
} from './kit-op13c.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-083';
const MISS = S13.jalmac;
const EVENT = 'OP13-096';

describeShield({ id: ID, rush: false });

function start(deckCards: CardId[]) {
  const g = me(LD13.plain, { hand: [ID], deck: deckCards });
  playRaw(g, ID);
  return g;
}

describeLook({
  id: ID,
  n: 5,
  start,
  match: [S13.warcury, 'OP13-091'],
  substr: EVENT,
  miss: MISS,
});

describe('OP13-083 [On Play]: which cards count as a "Five Elders" type card', () => {
  const rest = Array.from({ length: 10 }, () => S13.filler);

  it('a second copy of Saturn itself qualifies (no "other than")', () => {
    const g = start([ID, MISS, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID]);
  });

  it('a {Celestial Dragons} Character that is not a Five Elders is not offered', () => {
    const g = start([MISS, S13.warcury, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.warcury]);
  });

  it('"card": a {Five Elders} Event qualifies and can be added', () => {
    const g = start([EVENT, MISS, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    pickCards(g, [EVENT]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([EVENT]);
  });
});
