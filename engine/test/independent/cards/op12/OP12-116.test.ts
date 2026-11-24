/**
 * OP12-116 We'll Ring the Bell Waiting for You!! (Event, Yellow, cost 3, {Sky Island}/{Shandian Warrior}/{Jaya}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal a total of up to 2 "Shandian
 * Warrior" type Character cards or [Mont Blanc Noland] and add them to your hand. Then, place the rest
 * at the bottom of your deck in any order. [Trigger] Draw 1 card."
 *
 * Rules: CR 4-8-1 ("up to" allows 0), CR 11-2 (revealing), "a total of up to 2" caps the sum over both
 * descriptions at 2, [Trigger] CR 10-1-5. Only Character cards of the type qualify (a Shandian Warrior
 * Event does not); [Mont Blanc Noland] qualifies by name.
 */
import { describe, expect, it } from 'vitest';
import { hasEvent, reachablePickSets } from '../kit.ts';
import {
  activateTrigger,
  atMain,
  deck,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDR,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SC3,
  SCN,
  settleOrders,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-116';
/** Two Shandian Warrior Characters, [Mont Blanc Noland], a non-Character Shandian Warrior (Event), a Sky Island Character without the type. */
const TOP5 = [SC3.shan3, SC3.shan5, SC3.noland, 'OP08-116', 'OP05-110'];

function play(top: string[] = TOP5, fifth = SC3.shan6) {
  const g = mine(LDR.neutral, { hand: [EVENT], deck: topDeck([...top, fifth]) });
  playRaw(g, EVENT);
  return g;
}

describe("OP12-116 We'll Ring the Bell...: [Main] look at 5, add up to 2 Shandian Warrior Characters or [Mont Blanc Noland]", () => {
  it('candidates: Shandian Warrior Characters and [Mont Blanc Noland]; a Shandian Warrior Event and a Sky Island Character are not offered', () => {
    const g = play();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC3.shan3, SC3.shan5, SC3.noland].sort());
  });

  it('two Shandian Warriors: both go to hand, the other three go to the bottom, the 6th card is the new top', () => {
    const g = play();
    pickCards(g, [SC3.shan3, SC3.shan5]);
    settleOrders(g);
    expect(hand(g)).toEqual([SC3.shan3, SC3.shan5].sort());
    expect(deck(g)[0]).toBe(SC3.shan6);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g).slice(-3).sort()).toEqual([SC3.noland, 'OP08-116', 'OP05-110'].sort());
    expect(atMain(g)).toBe(true);
  });

  it('one Shandian Warrior and [Mont Blanc Noland] together is allowed (a total of 2)', () => {
    const g = play();
    pickCards(g, [SC3.shan5, SC3.noland]);
    settleOrders(g);
    expect(hand(g)).toEqual([SC3.shan5, SC3.noland].sort());
  });

  it('"a total of up to 2": no selection ever holds 3 cards', () => {
    const sets = reachablePickSets(play());
    expect(sets.size).toBeGreaterThan(1);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('"up to": one card, or none (then all 5 go to the bottom)', () => {
    const one = play();
    pickCards(one, [SC3.noland]);
    settleOrders(one);
    expect(hand(one)).toEqual([SC3.noland]);

    const g = play();
    need(g, 'choose');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SC3.shan6);
    expect(deck(g).slice(-5).sort()).toEqual([...TOP5].sort());
  });

  it('only the top 5 are looked at: a Shandian Warrior in 6th place is not offered', () => {
    const g = play([SCN.c3, SCN.c4, SCN.c5, SCN.c6, SCN.c7], SC3.shan6);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(deck(g)[0]).toBe(SC3.shan6);
  });

  it('the cards added are revealed; the cards put at the bottom are not', () => {
    const g = play();
    pickCards(g, [SC3.shan3]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.shan3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SC3.noland })).toBe(false);
  });

  it('the rest goes to the bottom of the deck, not to the trash', () => {
    const g = play();
    pickCards(g, [SC3.shan3]);
    settleOrders(g);
    expect(trash(g)).toEqual([EVENT]);
  });
});

describe("OP12-116 We'll Ring the Bell...: [Trigger] draw 1 card", () => {
  function hit() {
    const g = theirs(
      LDR.neutral,
      { life: [EVENT, SCN.c1, SCN.c1, SCN.c1], deck: topDeck([SCN.c2, SCN.c3]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating the Trigger draws exactly 1 card (no look at 5)', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(deck(g)).toHaveLength(11);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([EVENT]);
  });

  it('declining the Trigger puts the Event in my hand and draws nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(12);
  });
});
