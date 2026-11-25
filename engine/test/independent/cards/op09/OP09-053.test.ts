/**
 * OP09-053 Mohji (Character, Blue, cost 5, 5000, Counter +2000, {Cross Guild}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Richie] and add it to
 * your hand. Then, place the rest at the bottom of your deck in any order and play up to 1 [Richie]
 * from your hand."
 *
 * Rules: CR 8-4-4 ("up to"), CR 11-2-1 (reveal), CR 3-7-6 (Character limit). A card played by an
 * effect enters active and its cost is not paid. No prompt may depend on hidden cards: both "up to"
 * picks (over the looked-at cards, over the hand) are asked even when nothing qualifies.
 */
import { describe, expect, it } from 'vitest';
import { decision } from '../../helpers.ts';
import {
  answerEmptyChoose,
  at,
  atMain,
  chars,
  deck,
  deckTop,
  donSum,
  hand,
  hasEvent,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playId,
  reachablePickSets,
  settleOrders,
  tail,
  trash,
  V9,
} from './kit-op09b.ts';

const MOHJI = 'OP09-053';
const RICHIE = V9.richie;

function play(top: string[], handExtra: string[] = [], own: string[] = []) {
  const g = mine(L9.neutral, { hand: [MOHJI, ...handExtra], deck: deckTop(top), characters: own });
  playId(g, MOHJI);
  return g;
}

describe('OP09-053 Mohji: [On Play] look at 5 for [Richie], add it, rest to the bottom, then play up to 1 [Richie] from hand', () => {
  it('Richie among the top 5: it is offered alone, added to hand, then played from hand; the other 4 go to the bottom', () => {
    const g = play([V9.c4, RICHIE, V9.mr1, V9.c5, V9.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RICHIE]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RICHIE]);
    pickCards(g, [RICHIE]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([MOHJI, RICHIE].sort());
    expect(hand(g)).toEqual([]);
    expect(g.card(at(g, 'p1', 'characters', RICHIE)).rested).toBe(false);
    expect(tail(deck(g), 4)).toEqual([V9.c4, V9.mr1, V9.c5, V9.c6].sort());
    expect(deck(g)).toHaveLength(14);
  });

  it("the play is free: only Mohji's own cost 5 was paid (5 DON!! of 10 are still active)", () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    pickCards(g, [RICHIE]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('only a card named [Richie] qualifies: other {Cross Guild} cards are not offered to add or to play', () => {
    const g = play([V9.mr1, V9.mohjiCabaji5, RICHIE, V9.c4, V9.c4], [V9.buggy6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RICHIE]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RICHIE]);
  });

  it('"up to 1" on the look: adding nothing is allowed; a Richie already in hand can still be played', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4], [RICHIE]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RICHIE]);
    pickCards(g, [RICHIE]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([MOHJI, RICHIE].sort());
    expect(hand(g)).toEqual([]);
    // The Richie from the deck went to the bottom with the rest.
    expect(tail(deck(g), 5)).toEqual([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4].sort());
  });

  it('a Richie held in hand and one added: only 1 is played, the other stays in hand', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4], [RICHIE]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pickInst(g, [at(g, 'p1', 'hand', RICHIE)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g).filter((c) => c === RICHIE)).toHaveLength(1);
    expect(hand(g)).toEqual([RICHIE]);
  });

  it('"up to 1" on the play: declining leaves the added Richie in hand', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([RICHIE]);
    expect(chars(g)).toEqual([MOHJI]);
  });

  it('plays at most 1 Richie', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4], [RICHIE]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('no Richie anywhere: the look pick is asked empty (max 0) and so is the play pick; nothing moves', () => {
    const g = play([V9.c4, V9.c4, V9.c4, V9.c4, V9.c4], [V9.c2]);
    answerEmptyChoose(g, 'p1');
    settleOrders(g, 'p1');
    // The hand holds a Sai but no Richie: the play pick is still asked (max 0).
    answerEmptyChoose(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V9.c2]);
    expect(chars(g)).toEqual([MOHJI]);
  });

  it('only the top 5 are looked at: a Richie in position 6 is neither offered nor moved', () => {
    const g = play([V9.c4, V9.c4, V9.c4, V9.c4, V9.c4, RICHIE]);
    answerEmptyChoose(g, 'p1');
    settleOrders(g, 'p1');
    answerEmptyChoose(g, 'p1');
    expect(deck(g)[0]).toBe(RICHIE);
    expect(chars(g)).toEqual([MOHJI]);
  });

  it('the added Richie is revealed (CR 11-2-1) and the other looked-at cards are not', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    pickCards(g, [RICHIE]);
    expect(hasEvent(g, 'CardRevealed', { card: RICHIE })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: V9.c4 })).toBe(false);
  });

  it('with 5 Characters in play (Mohji and 4 others) the played Richie forces the Character limit trash (CR 3-7-6)', () => {
    const g = play([RICHIE, V9.c4, V9.c4, V9.c4, V9.c4], [], [V9.c4, V9.c5, V9.c6, V9.c7]);
    pickCards(g, [RICHIE]);
    settleOrders(g, 'p1');
    pickCards(g, [RICHIE]);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.purpose).toBe('characterLimit');
    pickInst(g, [at(g, 'p1', 'characters', V9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(RICHIE);
    expect(trash(g)).toEqual([V9.c4]);
  });
});
