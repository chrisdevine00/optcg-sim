/**
 * OP10-063 Vinsmoke Sanji (Character, Purple, cost 1, 2000, Counter +1000, {The Vinsmoke Family}/{Kingdom of GERMA}).
 *
 * Card text: "[On Play] If your Leader's type includes "GERMA", look at 5 cards from the top of your deck;
 * reveal up to 1 card with a type including "GERMA" and add it to your hand. Then, place the rest at
 * the bottom of your deck in any order."
 *
 * Rules: a type in quotation marks matches by inclusion (CR 2-4-3-1), so {GERMA 66} and {Kingdom of GERMA}
 * both include "GERMA"; "card" includes Events and Stages; "up to 1" (CR 8-1-2); CR 11-2-1 (revealed
 * cards); a failed "If" means the "Then" does not resolve (M4b-5).
 * Scenery: OP06-042 Vinsmoke Reiju (Leader, {The Vinsmoke Family}/{GERMA 66}), ST01-001 Luffy (Leader, no
 * GERMA); OP11-045 Vinsmoke Niji ({GERMA 66} Character), OP06-078 GERMA 66 ({GERMA 66} Event), OP06-063
 * Vinsmoke Sora ({Kingdom of GERMA}), OP01-023 Marco (no GERMA).
 * The shared "look at 5 ..." cases are `describeLook` in the kit (its titles mention another type name).
 */
import { describe, expect, it } from 'vitest';
import type { CardId } from '@optcg/engine';
import {
  atMain,
  C10,
  deck,
  describeLook,
  expectMain,
  hand,
  L10,
  mine,
  need,
  offeredNow,
  pickCards,
  playRaw,
  settleOrders,
  BLUE,
} from './kit-op10b.ts';

const SANJI = 'OP10-063';
const NIJI = C10.niji;
const GERMA_EVENT = 'OP06-078';
const SORA = C10.sora;
const MARCO = C10.marco;

const start = (deckTop: CardId[], leader: string = L10.germa) => {
  const g = mine(leader, { hand: [SANJI], deck: deckTop });
  playRaw(g, SANJI);
  return g;
};

describeLook({
  id: SANJI,
  n: 5,
  start: (cards) => start(cards),
  match: [NIJI, GERMA_EVENT],
  substr: SORA,
  miss: MARCO,
});

describe('OP10-063 Vinsmoke Sanji: [On Play] conditions and card kinds', () => {
  const rest = Array.from({ length: 9 }, () => BLUE);

  it('a {GERMA 66} Event and a {Kingdom of GERMA} Character both qualify ("card", type includes GERMA)', () => {
    const g = start([GERMA_EVENT, SORA, MARCO, MARCO, MARCO, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([GERMA_EVENT, SORA].sort());
  });

  it('with a Leader whose type does not include "GERMA" nothing is looked at, added or reordered', () => {
    const before = [NIJI, MARCO, MARCO, MARCO, MARCO, ...rest];
    const g = start(before, L10.luffy);
    expectMain(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toEqual(before);
  });

  it('the Leader condition reads the Leader, not the Character itself: Sanji is {Kingdom of GERMA} but a {Land of Wano} Leader still gets nothing', () => {
    const before = [NIJI, MARCO, MARCO, MARCO, MARCO, ...rest];
    const g = start(before, L10.wano);
    expectMain(g);
    expect(deck(g)).toEqual(before);
  });

  it('with a {GERMA 66} Leader and an adding of one card the effect ends back at the Main Phase', () => {
    const g = start([NIJI, MARCO, MARCO, MARCO, MARCO, ...rest]);
    pickCards(g, [NIJI]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([NIJI]);
  });
});
