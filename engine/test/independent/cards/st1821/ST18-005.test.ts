/**
 * ST18-005 Luffy-Tarou (Purple Character, cost 7, 8000, no Counter, {Straw Hat Crew}).
 * "[On Play] DON!! −1 (You may return the specified number of DON!! cards from your field to your
 * DON!! deck.): Play up to 1 purple "Straw Hat Crew" type Character card with a cost of 5 or less
 * from your hand."
 * Rules: DON!! −1 is a cost the player may decline; paying it returns 1 DON!! to the DON!! deck;
 * "up to 1" lets the player pick nothing after paying; the pick over the hidden hand is asked even
 * when nothing qualifies.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  askedEmpty,
  atMain,
  cost,
  donOf,
  donOnField,
  hand,
  LD,
  mine,
  need,
  none,
  offeredIds,
  payDon,
  pickCards,
  playId,
  reachablePickSets,
  SC,
  yes,
} from './kit-st1821a.ts';

const ID = 'ST18-005';
const U4 = SC.pshc4; // purple {Straw Hat Crew}, cost 4
const U3 = 'ST18-001'; // purple {Straw Hat Crew}, cost 3
const U5 = 'ST18-003'; // purple {Straw Hat Crew}, cost 5
const U6 = SC.pshc6; // purple {Straw Hat Crew}, cost 6
const RED5 = SC.shc5; // red {Straw Hat Crew}, cost 5
const GORDON = SC.gordon; // purple, not {Straw Hat Crew}

function start(h: string[], extra: Partial<PlayerSpec> = {}) {
  return mine(LD.shanks, { hand: [ID, ...h], ...cost(10), ...extra });
}

/** Play Luffy-Tarou and accept the DON!! −1 cost. */
function pay(g: ReturnType<typeof start>) {
  playId(g, ID);
  yes(g, 'p1');
  payDon(g, 1);
}

describe('ST18-005 Luffy-Tarou: [On Play] DON!! −1: play up to 1 purple {Straw Hat Crew} Character, cost 5 or less, from hand', () => {
  it('offers exactly the purple {Straw Hat Crew} Characters of cost 5 or less in my hand', () => {
    const g = start([U3, U4, U5, U6, RED5, GORDON]);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([U3, U4, U5].sort());
  });

  it('the pick enters the Character area active and leaves the hand', () => {
    const g = start([U4, U5]);
    pay(g);
    pickCards(g, [U4]);
    expect(atMain(g)).toBe(true);
    const played = g.zone('p1', 'characters').filter((c) => c.card === U4);
    expect(played).toHaveLength(1);
    expect(played[0]!.rested).toBe(false);
    expect(hand(g)).toEqual([U5]);
  });

  it('paying the cost returns exactly 1 DON!! from the field to the DON!! deck', () => {
    const g = start([U4]);
    playId(g, ID);
    const before = donOnField(g, 'p1');
    const deckBefore = donOf(g, 'p1').deck;
    yes(g, 'p1');
    payDon(g, 1);
    expect(donOnField(g, 'p1')).toBe(before - 1);
    expect(donOf(g, 'p1').deck).toBe(deckBefore + 1);
  });

  it('declining the DON!! −1: nothing is returned and nothing is played', () => {
    const g = start([U4]);
    playId(g, ID);
    const before = donOnField(g, 'p1');
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(atMain(g)).toBe(true);
    expect(donOnField(g, 'p1')).toBe(before);
    expect(hand(g)).toEqual([U4]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('cost boundary: cost 5 qualifies, cost 6 does not', () => {
    const g = start([U5, U6]);
    pay(g);
    expect(offeredIds(g)).toEqual([U5]);
  });

  it('"up to 1": after paying, choosing nothing plays nothing (the DON!! stays returned)', () => {
    const g = start([U4]);
    playId(g, ID);
    const before = donOnField(g, 'p1');
    yes(g, 'p1');
    payDon(g, 1);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([U4]);
    expect(donOnField(g, 'p1')).toBe(before - 1);
  });

  it('with no qualifying card in hand the pick is still asked (empty, done allowed): no prompt depends on the hidden hand', () => {
    const g = start([U6, RED5, GORDON]);
    pay(g);
    askedEmpty(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([U6, RED5, GORDON].sort());
  });

  it('at most 1 card is played even when several qualify', () => {
    const g = start([U3, U4, U5]);
    pay(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only my own hand is searched: nothing is played from the deck or trash', () => {
    const g = start([], { deck: [U4, U4, U4], trash: [U3] });
    pay(g);
    askedEmpty(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
