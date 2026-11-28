/**
 * OP18-061 Iceburg (Character, Purple, cost 2, 0 power, Counter +1000, {Water Seven}/{Galley-La
 * Company}).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to a total of 2 Stage cards or
 *    {Water Seven} type cards and add them to your hand. Then, place the rest at the bottom of your
 *    deck in any order."
 *
 * Rules: only the top 5 are looked at; "up to a total of 2" is a combined limit over both kinds
 * (two Stages, two {Water Seven} cards, or one of each), and may be 0 or 1; each added card is
 * revealed (CR 11-2-1); the rest go to the bottom. "Stage cards" qualify whatever their type, and
 * "{Water Seven} type cards" may be Characters or Stages (CR 2-4-3-1).
 *
 * Scenery: OP03-061 Kiwi & Mozu (Character, {Water Seven}), OP03-075 Galley-La Company (Stage,
 * {Water Seven}), OP03-020 Striker (Stage, {Whitebeard Pirates}), OP05-040 Birdcage (Stage, no
 * type), OP01-023 Marco and OP02-028 Usopp (Characters, neither Stage nor {Water Seven}).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  CH,
  choices,
  deck,
  donOf,
  fill,
  hand,
  hasEvent,
  kind,
  LDR,
  mine,
  minus,
  need,
  offeredIds,
  pickCards,
  playCard,
  reachablePickSets,
  settleOrders,
  skipPick,
  STG,
  tail,
} from './kit-ga.ts';

const ICEBURG = 'OP18-061';
const MISS = CH.marco3;
const KIWI = CH.kiwi2;
const BEYOND = STG.striker;
const REST = [BEYOND, ...fill(BLUE, 8)];
/** Top 5: a {Water Seven} Character, a {Water Seven} Stage, a non-{Water Seven} Stage, a Character and a Character. */
const TOP = [KIWI, STG.galley, STG.birdcage, MISS, CH.usopp3];

function begin(top: string[] = TOP, rest: string[] = REST) {
  const g = mine(LDR.luffy, { hand: [ICEBURG], deck: [...top, ...rest] });
  playCard(g, ICEBURG);
  return g;
}

function finish(g: ReturnType<typeof begin>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('OP18-061 Iceburg: [On Play] look at 5, add up to a total of 2 Stage or {Water Seven} cards', () => {
  it('offers exactly the Stage cards and {Water Seven} cards among the top 5', () => {
    const g = begin();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KIWI, STG.galley, STG.birdcage].sort());
  });

  it('happy path: adding 2 puts both in hand and the other 3 go to the bottom', () => {
    const g = begin();
    pickCards(g, [KIWI, STG.birdcage]);
    finish(g);
    expect(hand(g).sort()).toEqual([KIWI, STG.birdcage].sort());
    expect(deck(g)).toHaveLength(TOP.length + REST.length - 2);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 3)).toEqual(minus(TOP, [KIWI, STG.birdcage]).sort());
  });

  it('"a total of 2" is combined: two Stages are fine', () => {
    const g = begin();
    pickCards(g, [STG.galley, STG.birdcage]);
    finish(g);
    expect(hand(g).sort()).toEqual([STG.birdcage, STG.galley].sort());
  });

  it('"up to": adding only 1 is allowed', () => {
    const g = begin();
    pickCards(g, [STG.galley]);
    finish(g);
    expect(hand(g)).toEqual([STG.galley]);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [STG.galley]).sort());
  });

  it('"up to": adding nothing sends all 5 to the bottom', () => {
    const g = begin();
    skipPick(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('at most 2 in total, even with three candidates', () => {
    const sets = reachablePickSets(begin());
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('a Stage qualifies whatever its type (Striker is {Whitebeard Pirates})', () => {
    const g = begin([STG.striker, MISS, MISS, MISS, MISS], [CH.usopp3, ...fill(BLUE, 8)]);
    expect(offeredIds(g)).toEqual([STG.striker]);
  });

  it('a Character without the {Water Seven} type is never offered', () => {
    const g = begin();
    expect(offeredIds(g)).not.toContain(MISS);
    expect(offeredIds(g)).not.toContain(CH.usopp3);
  });

  it('only the top 5 are looked at: a {Water Seven} card in position 6 is not offered', () => {
    const g = begin([MISS, MISS, MISS, MISS, MISS], [KIWI, ...fill(BLUE, 8)]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      skipPick(g);
    }
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(KIWI);
  });

  it('CR 11-2-1: the added cards are revealed, a card sent to the bottom is not', () => {
    const g = begin();
    pickCards(g, [KIWI, STG.galley]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: KIWI })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: STG.galley })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('two copies of the same card count as two: both can be added', () => {
    const g = begin([KIWI, KIWI, MISS, MISS, MISS]);
    pickCards(g, [KIWI, KIWI]);
    finish(g);
    expect(hand(g)).toEqual([KIWI, KIWI]);
  });

  it('Iceburg costs 2 DON!! to play and stays on the field with power 0', () => {
    const g = begin();
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
    skipPick(g);
    finish(g);
    expect(g.power(g.find('p1', 'characters', ICEBURG))).toBe(0);
  });
});
