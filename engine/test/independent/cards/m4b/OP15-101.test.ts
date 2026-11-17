/**
 * OP15-101 Kalgara (Character, Yellow, cost 3, 5000, no Counter, {Sky Island}/{Shandian Warrior}/{Jaya}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Look at 5 cards from the top of your deck;
 * reveal up to a total of 2 [Mont Blanc Noland] or {Shandian Warrior} type cards and add them to your
 * hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-4-4-1 and 8-4-4-2 (up to / may find fewer), CR 2-1-2 ([Mont Blanc
 * Noland] is a name match, {Shandian Warrior} a type match).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  chooseCards,
  chooseNone,
  count,
  decline,
  deck,
  hand,
  kind,
  mine,
  offered,
  payWith,
  playCard,
  reachablePickSets,
  settleYes,
  SC,
  skipUnusable,
  tail,
  trash,
  YL,
} from './kit-a.ts';

const NOLAND = 'OP08-109'; // Mont Blanc Noland: {Jaya}/{Botanist}, not a Shandian Warrior
const TOP5 = [SC.genbo, NOLAND, SC.holly, SC.seto, SC.bobbin];
const BEYOND = SC.wyper6; // a {Shandian Warrior} in 6th place

function played(handExtra: string[] = [BLUE], top: string[] = TOP5) {
  const g = mine(YL.shandian, {
    hand: ['OP15-101', ...handExtra],
    deck: [...top, BEYOND, ...fill(BLUE, 8)],
  });
  playCard(g, 'OP15-101');
  return g;
}

function paid(top?: string[]) {
  const g = played([BLUE], top);
  expect(offered(g, 'p1')).toBe(true);
  accept(g);
  payWith(g, [g.find('p1', 'hand', BLUE)]);
  return g;
}

const members = (g: ReturnType<typeof played>) =>
  [...new Set([...reachablePickSets(g, 2)].flatMap((s) => s.split('+').filter(Boolean)))].sort();

describe('OP15-101 Kalgara: [On Play] trash 1 card: look at 5, add up to 2 [Mont Blanc Noland] / {Shandian Warrior} cards', () => {
  it('candidates: Shandian Warrior cards and [Mont Blanc Noland] among the top 5 only', () => {
    const g = paid();
    expect(kind(g)).toBe('choose');
    // Holly ({Sky Island} only) and Bobbin do not qualify; the Wyper in 6th place is not looked at.
    expect(members(g)).toEqual([SC.genbo, NOLAND, SC.seto].sort());
  });

  it('adds two chosen cards; the cost card is in the trash and the other 3 go to the bottom', () => {
    const g = paid();
    chooseCards(g, [NOLAND, SC.seto]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([NOLAND, SC.seto].sort());
    expect(trash(g)).toEqual([BLUE]);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 3)).toEqual([SC.genbo, SC.holly, SC.bobbin].sort());
  });

  it('"up to a total of 2": never more than 2, and 0 or 1 are fine', () => {
    const g = paid();
    const sets = reachablePickSets(g, 3);
    expect(sets.has('')).toBe(true);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([SC.genbo]);
  });

  it('CR 8-4-4-2: may add none; everything looked at goes to the bottom', () => {
    const g = paid();
    chooseNone(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 5)).toEqual([...TOP5].sort());
    expect(trash(g)).toEqual([BLUE]);
  });

  it('CR 8-3-1-4: declining the cost does nothing: no trash, no look', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(count(g, 'p1', 'trash')).toBe(0);
    expect(deck(g)).toEqual([...TOP5, BEYOND, ...fill(BLUE, 8)]);
  });

  it('CR 8-3-1-3: with an empty hand (Kalgara has left it) the cost cannot be paid', () => {
    const g = played([]);
    skipUnusable(g, 'p1');
    expect(deck(g)).toHaveLength(14);
    expect(hand(g)).toEqual([]);
  });

  it('the trashed card can be any card from hand (no filter on the cost)', () => {
    const g = played([SC.opera, SC.speed]);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    expect(trash(g)).toEqual([SC.speed]);
  });
});
