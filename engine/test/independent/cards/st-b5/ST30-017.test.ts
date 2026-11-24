/**
 * ST30-017 And You Get Yourself in Big Trouble!! (Event, Red, cost 1, {Whitebeard Pirates}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 Character card with
 * 6000 power and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: "6000 power" is exactly 6000 (RL-49), an Event costs its DON!! and is trashed before its
 * effect resolves (CR 2-7-3, 8-4-2), a [Trigger] activates instead of adding the card to hand and
 * costs nothing but its own effect's cost (CR 10-1-5-1, RD 105: the [Main] has no DON!! cost here),
 * the card is trashed afterwards (CR 10-1-5-3).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  choices,
  declineTrigger,
  deck,
  don,
  hand,
  hasEvent,
  hitLeader,
  kind,
  lifeCards,
  mine,
  minus,
  need,
  none,
  offeredIds,
  outcomes,
  pickCards,
  playCardRaw,
  reachablePickSets,
  settleOrders,
  SL,
  tail,
  theirs,
  trash,
} from './kit-stb5a.ts';

const ID = 'ST30-017';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const JIL = 'OP03-006'; // Red, cost 4, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const SAI = 'OP01-012'; // Red, 4000
const KOM = 'OP01-010'; // Red, 3000
const BELOW = 'OP02-007';
const TOP = [HAJ, KING, MARCO, JIL, SAI];

function play(top: string[] = TOP, below: string[] = [BELOW, ...Array(7).fill(BLUE)]) {
  const g = mine(SL.luffy, { hand: [ID], deck: [...top, ...below] });
  playCardRaw(g, ID);
  return g;
}

/** p2 hits p1's Leader; p1's top Life card is the Event; p1 has 0 DON!!. */
function triggered(top: string[] = TOP) {
  const g = theirs(SL.luffy, {
    life: [ID, BLUE, BLUE, BLUE],
    deck: [...top, BELOW, ...Array(7).fill(BLUE)],
  });
  hitLeader(g);
  return g;
}

describe('ST30-017 And You Get Yourself in Big Trouble!!: [Main] look at 5, add up to 1 Character with 6000 power', () => {
  it('offers exactly the Characters with exactly 6000 power in the top 5', () => {
    const g = play();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL].sort());
  });

  it('adds the chosen card (revealed), puts the other four at the bottom, trashes the Event and pays 1 DON!!', () => {
    const g = play();
    pickCards(g, [HAJ]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)[0]).toBe(BELOW);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [HAJ]).sort());
    expect(hasEvent(g, 'CardRevealed', { card: HAJ })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: KING })).toBe(false);
    expect(don(g).rested).toBe(1);
    expect(don(g).active).toBe(9);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = play();
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
    expect(trash(g)).toEqual([ID]);
  });

  it('adds at most one card even when two qualify', () => {
    const sets = reachablePickSets(play());
    expect(sets.has(HAJ)).toBe(true);
    expect(sets.has(JIL)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a 6000-power Character in position 6 is not offered', () => {
    const g = play([KING, MARCO, SAI, KOM, KING], [HAJ, ...Array(7).fill(BLUE)]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(HAJ);
  });

  it('the rest are ordered by the owner: all 24 orders of four different cards are reachable', () => {
    const g = play();
    pickCards(g, [HAJ]);
    const seen = outcomes(g, 'p1', (x) => deck(x).slice(-4).join(','), 12);
    expect(seen.size).toBe(24);
  });

  it('cannot be played with no active DON!! (cost 1)', () => {
    const g = mine(SL.luffy, {
      hand: [ID],
      deck: [...TOP, BELOW],
      costArea: { active: 0, rested: 10 },
    });
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });

  it('[Trigger]: activating it from Life runs the [Main] effect for no DON!!, then trashes the card', () => {
    const g = triggered();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL].sort());
    pickCards(g, [JIL]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([JIL]);
    expect(trash(g)).toEqual([ID]);
    expect(lifeCards(g)).toHaveLength(3);
    expect(don(g).rested).toBe(0);
  });

  it('[Trigger] declined: the card goes to hand and nothing is looked at', () => {
    const g = triggered();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(HAJ);
  });
});
