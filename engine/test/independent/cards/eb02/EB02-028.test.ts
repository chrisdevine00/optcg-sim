/**
 * EB02-028 Portgas.D.Ace (Character, Blue, cost 5, 5000, Counter +1000, {Alabasta}/{Whitebeard Pirates}).
 *
 * Card text: "[On Play] If your Leader's type includes "Whitebeard Pirates", look at 5 cards from the
 * top of your deck; reveal up to 1 Character card with a cost of 2 and add it to your hand. Then,
 * place the rest at the bottom of your deck in any order and play up to 1 Character card with a cost
 * of 2 from your hand rested."
 *
 * Rules: "a cost of 2" is exact; "up to" (CR 8-4-4-1/-2); effect plays cost nothing.
 * Leaders: ST13-002 Portgas.D.Ace ({Whitebeard Pirates}), OP02-001 Edward.Newgate ({The Four
 * Emperors}/{Whitebeard Pirates}). Scenery: Sai (Character, cost 2), Momoo (Character, cost 2),
 * Koala (Character, cost 2), Mohji (cost 1), Marco (cost 3), EB02-060 Merry Go (Stage, cost 2).
 */
import { describe, expect, it } from 'vitest';
import {
  choices,
  decision,
  deck,
  donOf,
  driveLookPlay,
  E2C,
  E2L,
  fill,
  hand,
  kind,
  mine,
  playRaw,
  reachablePickSets,
  tail,
  walkToHandPick,
} from './kit-eb02a.ts';

const ACE = 'EB02-028';
const STAGE2 = 'EB02-060';
const NEWGATE = 'OP02-001';
const FILL = E2C.hajrudin;

function start(leader: string, top: string[], handExtra: string[] = []) {
  const g = mine(leader, {
    hand: [ACE, ...handExtra],
    deck: [...top, ...fill(FILL, 10)],
  });
  playRaw(g, ACE);
  return g;
}

const names = (g: ReturnType<typeof start>) =>
  choices(g)
    .map((i) => g.card(i).card)
    .sort();

describe('EB02-028 Portgas.D.Ace: [On Play] with a {Whitebeard Pirates} Leader, look at 5, add a cost-2 Character, play a cost-2 Character rested', () => {
  it('offers exactly the Character cards of cost 2 among the top 5', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.mohji, E2C.marco, STAGE2, E2C.momoo]);
    expect(names(g)).toEqual([E2C.momoo, E2C.sai].sort());
  });

  it('adds the chosen card to hand and may play a cost-2 Character from hand rested', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.mohji, E2C.marco, STAGE2, E2C.momoo]);
    driveLookPlay(g, [E2C.sai], [E2C.sai]);
    const sai = g.find('p1', 'characters', E2C.sai);
    expect(g.card(sai).rested).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(donOf(g, 'p1').active).toBe(5);
  });

  it('the other 4 looked-at cards go to the bottom of the deck', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.mohji, E2C.marco, STAGE2, E2C.momoo]);
    driveLookPlay(g, [E2C.sai], []);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(FILL);
    expect(tail(deck(g), 4)).toEqual([E2C.mohji, E2C.marco, STAGE2, E2C.momoo].sort());
    expect(hand(g)).toEqual([E2C.sai]);
  });

  it('the cost is exact: costs 1 and 3 are not offered', () => {
    const g = start(E2L.ace, [E2C.mohji, E2C.marco, E2C.sai, E2C.hajrudin, E2C.kingdew]);
    expect(names(g)).toEqual([E2C.sai]);
  });

  it('a Stage of cost 2 is not a Character card', () => {
    const g = start(E2L.ace, [STAGE2, E2C.sai, E2C.marco, E2C.marco, E2C.marco]);
    expect(names(g)).not.toContain(STAGE2);
  });

  it('with a Leader that does not include "Whitebeard Pirates" nothing happens', () => {
    const g = start(E2L.croc, [E2C.sai, E2C.momoo, E2C.marco, E2C.marco, E2C.marco]);
    expect(decision(g)?.kind).toBe('main');
    expect(deck(g)[0]).toBe(E2C.sai);
    expect(deck(g)).toHaveLength(15);
  });

  it('a Leader with {Whitebeard Pirates} among several types (Edward.Newgate) qualifies', () => {
    const g = start(NEWGATE, [E2C.sai, E2C.marco, E2C.marco, E2C.marco, E2C.marco]);
    expect(names(g)).toEqual([E2C.sai]);
  });

  it('"up to 1": revealing nothing puts all 5 at the bottom', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.momoo, E2C.marco, E2C.mohji, E2C.hajrudin]);
    driveLookPlay(g, [], []);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(FILL);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ACE]);
  });

  it('reveals at most one even when two cost-2 Characters are in the top 5', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.momoo, E2C.marco, E2C.marco, E2C.marco]);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('only the top 5 are looked at: a cost-2 Character in 6th place is not offered', () => {
    const g = start(E2L.ace, [E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.sai]);
    expect(kind(g) === 'choose' ? choices(g) : []).toEqual([]);
    driveLookPlay(g, [], []);
    expect(deck(g)[0]).toBe(E2C.sai);
  });

  it('the play is "up to 1" and exact-cost: a cost-2 Character already in hand may be played rested, a cost-1 one may not', () => {
    const g = start(
      E2L.ace,
      [E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.marco],
      [E2C.momoo, E2C.mohji],
    );
    driveLookPlay(g, [], [E2C.momoo]);
    expect(g.card(g.find('p1', 'characters', E2C.momoo)).rested).toBe(true);
    expect(hand(g)).toEqual([E2C.mohji]);
  });

  it('the "play up to 1" pick over the hand is asked (at max 0) even when no cost-2 Character is in hand', () => {
    const g = start(E2L.ace, [E2C.marco, E2C.marco, E2C.marco, E2C.marco, E2C.marco]);
    const d = walkToHandPick(g);
    expect(d).not.toBeNull();
    expect(d?.max).toBe(0);
  });

  it('the revealed card may stay in hand (the play is optional)', () => {
    const g = start(E2L.ace, [E2C.sai, E2C.marco, E2C.marco, E2C.marco, E2C.marco]);
    driveLookPlay(g, [E2C.sai], []);
    expect(hand(g)).toEqual([E2C.sai]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ACE]);
  });
});
