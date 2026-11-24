/**
 * OP13-065 Shanks (Character, Purple, cost 1, 2000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 card with a type
 * including "Roger Pirates" other than [Shanks] and add it to your hand. Then, place the rest at the
 * bottom of your deck in any order."
 *
 * Rules: CR 11-2-1 (revealing), CR 11-3 (looking), CR 2-4-3-1 ("type including" matches {Former Roger
 * Pirates}), CR 2-1-2 ([Shanks] is an exact name), "card" is any category, CR 4-8-1 ("up to").
 * The generic look-at-N tests come from `describeLook`.
 * Scenery: OP13-062 Crocus and OP13-063 Oden ({Roger Pirates}), EB01-041 Crocus ({Former Roger
 * Pirates}), OP12-007 Shanks ({Roger Pirates}, named [Shanks]), OP01-023 Marco (no Roger Pirates).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deck,
  describeLook,
  hand,
  LD13,
  me,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  S13,
  settleOrders,
  tail,
  trash,
} from './kit-op13c.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-065';
const MISS = S13.c3;

function start(deckCards: CardId[]) {
  const g = me(LD13.plain, { hand: [ID], deck: deckCards });
  playRaw(g, ID);
  return g;
}

describeLook({
  id: ID,
  n: 5,
  start,
  match: [S13.rp5, S13.rp5b],
  substr: S13.formerRp6,
  miss: MISS,
});

describe('OP13-065 Shanks: "other than [Shanks]" and "card with a type including Roger Pirates"', () => {
  const pad = (k: number) => Array.from({ length: k }, () => MISS);
  const rest = Array.from({ length: 10 }, () => S13.filler);

  it('a card named [Shanks] with a Roger Pirates type is not offered; another Roger Pirates card is', () => {
    const g = start([S13.shanksRp, S13.rp5, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.rp5]);
  });

  it('a second copy of OP13-065 Shanks in the deck is not offered either', () => {
    const g = start([ID, S13.rp5, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.rp5]);
  });

  it('only [Shanks] cards among the top 5: nothing is offered and all five go to the bottom', () => {
    const top = [S13.shanksRp, ID, MISS, MISS, MISS];
    const g = start([...top, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('"card": an Event with the Roger Pirates type (OP13-075) and a Stage (OP13-078) qualify', () => {
    const g = start(['OP13-075', 'OP13-078', MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP13-075', 'OP13-078']);
    pickCards(g, ['OP13-078']);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual(['OP13-078']);
  });

  it('with only 3 cards in the deck it looks at those 3, may add one, and puts the rest at the bottom', () => {
    const top = [S13.rp5, MISS, S13.rp5b];
    const g = start(top);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.rp5, S13.rp5b].sort());
    pickCards(g, [S13.rp5b]);
    settleOrders(g);
    expect(hand(g)).toEqual([S13.rp5b]);
    expect(deck(g)).toHaveLength(2);
    expect(tail(deck(g), 2)).toEqual(minus(top, [S13.rp5b]).sort());
    expect(trash(g)).toEqual([]);
  });

  it('the played Shanks itself stays on the field and the hand gains nothing without a pick', () => {
    const g = start([S13.rp5, MISS, MISS, MISS, MISS, ...rest]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(pad(0)).toEqual([]);
  });
});
