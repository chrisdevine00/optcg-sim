/**
 * OP16-082 Kin'emon (Character, Black, cost 4, 6000, no Counter, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: "This Character gains +3 cost. [On Play] If your Leader has the {Land of Wano} type, look
 * at 5 cards from the top of your deck; reveal up to 1 {Land of Wano} type card and add it to your
 * hand. Then, trash the rest."
 *
 * Rules: CR 11-2-1 (reveal), CR 8-4-4-1 ("up to"), CR 1-3-6 (cost modifiers), RD 122 (a failed "If"
 * ends the effect).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  at,
  BLUE,
  cardIds,
  deck,
  deckOf,
  don,
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

const ID = 'OP16-082';
const EVENT = 'OP16-099'; // a {Land of Wano} Event (a card of the type, not a Character)

function start(top: string[], leader: string = LD16.wano) {
  const g = p1main(leader, { hand: [ID], deck: deckOf(top) });
  playIt(g, ID);
  return g;
}

describe("OP16-082 Kin'emon: [On Play] look at 5, add up to 1 {Land of Wano}, trash the rest", () => {
  it('offers exactly the {Land of Wano} cards of the top 5; the pick goes to hand, the other four are trashed', () => {
    const g = start([SC16.wano3, BLUE, SC16.wano1, BLUE, SC16.plain8]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC16.wano1, SC16.wano3].sort());
    pickCards(g, [SC16.wano3]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC16.wano3]);
    expect(trash(g)).toEqual([BLUE, SC16.wano1, BLUE, SC16.plain8].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('the chosen card is revealed; the unchosen ones are not', () => {
    const g = start([SC16.wano3, BLUE, BLUE, BLUE, BLUE]);
    pickCards(g, [SC16.wano3]);
    expect(hasEvent(g, 'CardRevealed', { card: SC16.wano3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: BLUE })).toBe(false);
  });

  it('"up to 1": adding nothing trashes all five looked-at cards', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE, BLUE]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(5);
    expect(deck(g)).toHaveLength(10);
  });

  it('adds at most one card even when two qualify', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE, BLUE]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.size).toBeGreaterThan(1);
  });

  it('only the top 5 are looked at: a {Land of Wano} card in position 6 is not offered and stays on the deck', () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, BLUE, SC16.wano3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(deck(g)[0]).toBe(SC16.wano3);
    expect(hand(g)).toEqual([]);
  });

  it('a {Land of Wano} Event counts as a card of that type', () => {
    const g = start([EVENT, BLUE, BLUE, BLUE, BLUE]);
    expect(offeredIds(g)).toEqual([EVENT]);
    pickCards(g, [EVENT]);
    expect(hand(g)).toEqual([EVENT]);
  });

  it('condition: a Leader without {Land of Wano} looks at nothing (no prompt, deck and trash untouched)', () => {
    const g = start([SC16.wano3, SC16.wano1, BLUE, BLUE, BLUE], LD16.plain);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(SC16.wano3);
  });

  it('the +3 cost applies on the field (4 -> 7) but not in hand: playing it costs 4 DON!!', () => {
    const g = p1main(LD16.wano, { hand: [ID], deck: deckOf([BLUE, BLUE, BLUE, BLUE, BLUE]) });
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(4);
    playIt(g, ID);
    if (kind(g) === 'choose') none(g);
    expect(don(g).active).toBe(6);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(7);
  });

  it("the played Kin'emon is not among the looked-at cards and stays on the field", () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, BLUE]);
    if (kind(g) === 'choose') none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ID]);
  });
});
