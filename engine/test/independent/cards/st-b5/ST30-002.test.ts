/**
 * ST30-002 Inazuma (Character, Red, cost 1, 2000, Counter +1000, {Revolutionary Army}/{Impel Down}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 Character card with
 * 6000 power and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order."
 *
 * Rules: "6000 power" means exactly 6000 (rulings RL-49, QA-ST30), only Character cards have power,
 * "up to 1" allows 0 (CR 8-4-4-1), an added card is revealed (CR 11-2-1), the rest go to the bottom
 * and the owner orders them (CR 3-1-7, bottom-order.md).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  choices,
  deck,
  hand,
  hasEvent,
  kind,
  mine,
  minus,
  need,
  none,
  offeredIds,
  outcomes,
  OV,
  pickCards,
  playCardRaw,
  reachablePickSets,
  settleOrders,
  SL,
  tail,
  trash,
} from './kit-stb5a.ts';

const ID = 'ST30-002';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const JIL = 'OP03-006'; // Red, cost 4, 6000
const KING = 'OP02-006'; // Red, cost 5, 7000
const MARCO = 'OP01-023'; // Red, cost 3, 5000
const SAI = 'OP01-012'; // Red, cost 2, 4000
const KOM = 'OP01-010'; // Red, cost 1, 3000
const EVENT = 'ST30-015'; // Red Event, cost 1 (no power)
const BELOW = 'OP02-007'; // Thatch, Red, cost 6, 8000: sits below the top 5

/** p1 plays Inazuma with `top` as the top of the deck (then 8 Mohji below). */
function start(top: string[], below: string[] = [BELOW, ...Array(7).fill(BLUE)]) {
  const g = mine(SL.luffy, { hand: [ID], deck: [...top, ...below] });
  playCardRaw(g, ID);
  return g;
}
const TOP = [HAJ, KING, MARCO, JIL, SAI];

describe('ST30-002 Inazuma: [On Play] look at 5, add up to 1 Character with 6000 power', () => {
  it('offers exactly the Characters with exactly 6000 power in the top 5 (not 7000, not 5000)', () => {
    const g = start(TOP);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL].sort());
  });

  it('the chosen card goes to hand, the other four go to the bottom, and the card is revealed', () => {
    const g = start(TOP);
    pickCards(g, [JIL]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([JIL]);
    expect(deck(g)).toHaveLength(13 - 1);
    expect(deck(g)[0]).toBe(BELOW);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [JIL]).sort());
    expect(hasEvent(g, 'CardRevealed', { card: JIL })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: KING })).toBe(false);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = start(TOP);
    none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(BELOW);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(start(TOP));
    expect(sets.has('')).toBe(true);
    expect(sets.has(HAJ)).toBe(true);
    expect(sets.has(JIL)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a 6000-power Character in position 6 is not offered', () => {
    const g = start([KING, MARCO, SAI, KOM, KING], [HAJ, ...Array(7).fill(BLUE)]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(HAJ);
  });

  it('an Event is not a candidate (only Character cards have power)', () => {
    const g = start([EVENT, HAJ, MARCO, SAI, KOM]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ]);
  });

  it('the rest are placed in an order the owner chooses: all 24 orders of four different cards are reachable', () => {
    const g = start(TOP);
    pickCards(g, [HAJ]);
    const seen = outcomes(g, 'p1', (x) => tail4(x), 12);
    expect(seen.size).toBe(24);
  });

  it('with no 6000-power Character in the top 5 nothing is added and the five go to the bottom', () => {
    const g = start([KING, MARCO, SAI, KOM, OV.thatch]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([KING, MARCO, SAI, KOM, OV.thatch].sort());
  });

  it('costs 1 DON!! to play, leaves Inazuma on the field and the opponent untouched', () => {
    const g = start(TOP);
    pickCards(g, [HAJ]);
    settleOrders(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
    expect(g.zone('p2', 'deck')).toHaveLength(15);
    expect(trash(g)).toEqual([]);
  });

  it('with fewer than 5 cards in the deck it looks at all of them', () => {
    const g = start([HAJ, KING], []);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ]);
    pickCards(g, [HAJ]);
    settleOrders(g);
    expect(hand(g)).toEqual([HAJ]);
    expect(deck(g)).toEqual([KING]);
  });
});

function tail4(g: ReturnType<typeof start>): string {
  return deck(g).slice(-4).join(',');
}
