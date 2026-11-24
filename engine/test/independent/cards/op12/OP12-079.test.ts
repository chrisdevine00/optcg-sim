/**
 * OP12-079 Luffy Is the Man Who Will Be King of the Pirates!!! (Event, Purple, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] If your Leader is [Sanji], look at 3 cards from the top of your deck and add up to
 * 1 card to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 4-8-1 ("up to" allows 0), CR 11-2 (looking is private: no reveal), M4b-5 (a "Then" after a
 * failed "If" does not resolve), a Leader "is [Sanji]" by name.
 */
import { describe, expect, it } from 'vitest';
import { hasEvent } from '../kit.ts';
import {
  atMain,
  deck,
  hand,
  kind,
  LDR,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SCN,
  settleOrders,
  topDeck,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-079';
const TOP = [SCN.c3, SCN.c4, SCN.c5];

function start(leader: string = LDR.sanji, top: string[] = TOP) {
  const g = mine(leader, { hand: [EVENT], deck: topDeck([...top, SCN.c6]) });
  playRaw(g, EVENT);
  return g;
}

describe('OP12-079 Luffy Is the Man...: [Main] if Sanji, look at 3, add up to 1, rest to the bottom', () => {
  it('with [Sanji] as Leader the top 3 are offered (and only the top 3)', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...TOP].sort());
  });

  it('the chosen card goes to hand; the other two go to the bottom; the deck top is the 4th card', () => {
    const g = start();
    pickCards(g, [SCN.c4]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c4]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SCN.c6);
    expect(deck(g).slice(-2).sort()).toEqual([SCN.c3, SCN.c5].sort());
  });

  it('"up to 1": may add nothing; then all three go to the bottom', () => {
    const g = start();
    need(g, 'choose');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SCN.c6);
    expect(deck(g).slice(-3).sort()).toEqual([...TOP].sort());
  });

  it('adds at most one card', () => {
    const g = start();
    need(g, 'choose');
    pickCards(g, [SCN.c3]);
    settleOrders(g);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(13);
  });

  it('a card of any kind may be added (an Event among the three)', () => {
    const g = start(LDR.sanji, [SCN.c3, 'OP12-079', SCN.c5]);
    expect(offeredIds(g)).toEqual([SCN.c3, 'OP12-079', SCN.c5].sort());
    pickCards(g, ['OP12-079']);
    settleOrders(g);
    expect(hand(g)).toEqual(['OP12-079']);
  });

  it('looking is not revealing: none of the looked-at cards is revealed', () => {
    const g = start();
    pickCards(g, [SCN.c4]);
    settleOrders(g);
    for (const c of TOP) expect(hasEvent(g, 'CardRevealed', { card: c })).toBe(false);
  });

  it('without [Sanji] as Leader nothing is looked at or added, and the deck is untouched', () => {
    const g = start(LDR.luffy);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SCN.c3);
    expect(deck(g)).toHaveLength(14);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the Leader is checked by name: the other [Sanji] Leader (OP12-041) works too', () => {
    const g = start('OP12-041');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...TOP].sort());
  });

  it('with only 2 cards in the deck, those 2 are looked at', () => {
    const g = mine(LDR.sanji, { hand: [EVENT], deck: [SCN.c3, SCN.c4] });
    playRaw(g, EVENT);
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
    pickCards(g, [SCN.c3]);
    settleOrders(g);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(deck(g)).toEqual([SCN.c4]);
  });
});
