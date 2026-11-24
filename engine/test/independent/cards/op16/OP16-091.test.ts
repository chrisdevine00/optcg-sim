/**
 * OP16-091 Nami (Character, Black, cost 1, 2000, Counter +1000, {Land of Wano}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] If your Leader has the {Land of Wano} type, look at 4 cards from the top of
 * your deck; reveal up to 1 {Land of Wano} type card other than [Nami] and add it to your hand.
 * Then, trash the rest."
 *
 * Rules: CR 11-2-1 (reveal), CR 8-4-4-1 ("up to"), RD 122 (a failed "If" ends the effect).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  deck,
  deckOf,
  hand,
  hasEvent,
  kind,
  LD16,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  reachablePickSets,
  SC16,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-091';

function start(top: string[], leader: string = LD16.wano) {
  const g = p1main(leader, { hand: [ID], deck: deckOf(top) });
  playIt(g, ID);
  return g;
}

describe('OP16-091 Nami: [On Play] look at 4, add up to 1 {Land of Wano} other than [Nami], trash the rest', () => {
  it('offers the {Land of Wano} cards of the top 4; the pick goes to hand, the other three are trashed', () => {
    const g = start([SC16.wano3, BLUE, SC16.wano1, SC16.plain8]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC16.wano1, SC16.wano3].sort());
    pickCards(g, [SC16.wano1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano1]);
    expect(trash(g)).toEqual([SC16.wano3, BLUE, SC16.plain8].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('[Nami] is excluded: another copy of OP16-091 among the top 4 is not offered (and is trashed)', () => {
    const g = start([ID, SC16.wano3, BLUE, BLUE]);
    expect(offeredIds(g)).toEqual([SC16.wano3]);
    pickCards(g, [SC16.wano3]);
    expect(trash(g)).toContain(ID);
    expect(hand(g)).toEqual([SC16.wano3]);
  });

  it('only the top 4 are looked at: a {Land of Wano} card in position 5 is not offered and stays on the deck', () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, SC16.wano3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(deck(g)[0]).toBe(SC16.wano3);
    expect(trash(g)).toHaveLength(4);
  });

  it('"up to 1": adding nothing trashes all four', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE]);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(4);
  });

  it('adds at most one card even when two qualify', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has(SC16.wano1)).toBe(true);
    expect(sets.has(SC16.wano3)).toBe(true);
  });

  it('the chosen card is revealed; the trashed ones are not', () => {
    const g = start([SC16.wano3, BLUE, BLUE, BLUE]);
    pickCards(g, [SC16.wano3]);
    expect(hasEvent(g, 'CardRevealed', { card: SC16.wano3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: BLUE })).toBe(false);
  });

  it('condition: a Leader without {Land of Wano} does nothing (no look, deck and trash untouched)', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE], LD16.plain);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
  });

  it('a {Land of Wano} Event counts as a card of the type', () => {
    const g = start(['OP16-099', BLUE, BLUE, BLUE]);
    expect(offeredIds(g)).toEqual(['OP16-099']);
    pickCards(g, ['OP16-099']);
    expect(hand(g)).toEqual(['OP16-099']);
  });

  it('a card whose type merely resembles it (Peachbeard, not {Land of Wano}) is not offered', () => {
    const g = start([SC16.bbAllies3, SC16.wano3, BLUE, BLUE]);
    expect(offeredIds(g)).toEqual([SC16.wano3]);
  });
});
