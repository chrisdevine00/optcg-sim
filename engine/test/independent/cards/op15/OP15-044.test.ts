/**
 * OP15-044 Koala (Character, Blue, cost 3, 2000, Counter +1000, {Revolutionary Army}/{Dressrosa},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On K.O.] Look at 3 cards from the top of your deck; reveal up to 1
 * {Dressrosa} type Event and add it to your hand. Then, place the rest at the bottom of your deck
 * in any order."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 ([On K.O.]), CR 8-4-4-2 ("up to"), CR 11-2-1 (reveal).
 * Events with the {Dressrosa} type on file: OP15-019 Barrier Bulls, OP15-020 Fire Fist, OP15-021
 * Just Watch Me, Ace!!!.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from './kit-op15a.ts';
import {
  atMain,
  at,
  BLUE,
  deck,
  hand,
  hasEvent,
  kw,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  S15,
  SCN,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op15a.ts';
import { canFinish, choices, kind, act } from './kit-op15a.ts';

const KOALA = 'OP15-044';
const BULLS = 'OP15-019'; // {Dressrosa} Event
const FIST = 'OP15-020'; // {Dressrosa} Event
const JWM = 'OP15-021'; // {Dressrosa} Event
const DRESS_CHAR = S15.bellamy; // {Dressrosa} Character
const OTHER_EVENT = S15.event; // not {Dressrosa}

/** p2 attacks the rested Koala (2000) with a 5000 Character: it is K.O.d. My deck top, then 8 filler. */
function koKoala(top: string[], rest: string[] = Array.from({ length: 8 }, () => BLUE)) {
  const g = theirs(
    LD15.luffy,
    { characters: [{ card: KOALA, rested: true }], deck: [...top, ...rest] },
    { characters: [SCN.c3] },
  );
  attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', KOALA));
  passBlock(g);
  passCounter(g);
  return g;
}

function finish(g: ReturnType<typeof koKoala>) {
  settleOrders(g, 'p1');
  expect(atMain(g, 'p2')).toBe(true);
}
function skipEmpty(g: ReturnType<typeof koKoala>) {
  if (kind(g) === 'choose') {
    expect(choices(g)).toHaveLength(0);
    if (canFinish(g)) act(g, { type: 'done' });
  }
  finish(g);
}

describe('OP15-044 Koala: [Blocker]', () => {
  it('has [Blocker] on either turn and blocks an attack on my Leader', () => {
    const g = theirs(LD15.luffy, { characters: [KOALA] }, { characters: [SCN.c3] });
    expect(kw(g, at(g, 'p1', 'characters', KOALA))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', KOALA)]);
    const m = mine(LD15.luffy, { characters: [KOALA] });
    expect(kw(m, at(m, 'p1', 'characters', KOALA))).toContain('Blocker');
  });
});

describe('OP15-044 Koala: [On K.O.] look at 3, add up to 1 {Dressrosa} Event', () => {
  it('offers exactly the {Dressrosa} Events of the top 3; the pick goes to hand, the others to the bottom', () => {
    const g = koKoala([BULLS, DRESS_CHAR, JWM]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BULLS, JWM].sort());
    pickCards(g, [JWM]);
    finish(g);
    expect(hand(g)).toEqual([JWM]);
    expect(deck(g)).toHaveLength(10);
    expect(deck(g)[0]).toBe(BLUE);
    expect(tail(deck(g), 2)).toEqual([BULLS, DRESS_CHAR].sort());
    expect(trash(g)).toEqual([KOALA]);
  });

  it('a {Dressrosa} Character and a non-{Dressrosa} Event are not candidates', () => {
    const g = koKoala([DRESS_CHAR, OTHER_EVENT, BULLS]);
    expect(offeredIds(g)).toEqual([BULLS]);
  });

  it('the added Event is revealed, the others are not', () => {
    const g = koKoala([FIST, DRESS_CHAR, BLUE]);
    pickCards(g, [FIST]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: FIST })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: DRESS_CHAR })).toBe(false);
  });

  it('"up to 1": may add nothing; all 3 go to the bottom', () => {
    const g = koKoala([BULLS, JWM, FIST]);
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(BLUE);
    expect(tail(deck(g), 3)).toEqual([BULLS, JWM, FIST].sort());
  });

  it('adds at most one card even when three qualify', () => {
    const sets = reachablePickSets(koKoala([BULLS, JWM, FIST]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(BULLS)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: a {Dressrosa} Event in position 4 is not offered', () => {
    const g = koKoala([BLUE, BLUE, BLUE], [BULLS, ...Array.from({ length: 8 }, () => BLUE)]);
    skipEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BULLS);
  });

  it('with no {Dressrosa} Event in the top 3 nothing is added and the 3 cards go to the bottom', () => {
    const g = koKoala([DRESS_CHAR, OTHER_EVENT, BLUE]);
    expect(offeredIds(g)).toEqual([]);
    skipEmpty(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
  });

  it('it does not happen when Koala survives the battle', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [{ card: KOALA, rested: true }], deck: [BULLS, BLUE, BLUE, BLUE] },
      { characters: [S15.cobra0] },
    );
    attack(g, at(g, 'p2', 'characters', S15.cobra0), at(g, 'p1', 'characters', KOALA));
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    expect(hand(g)).toEqual([]);
    void mine;
  });
});
