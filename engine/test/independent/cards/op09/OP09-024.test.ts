/**
 * OP09-024 Usopp (Character, Green, cost 4, 5000, Counter +1000, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, draw 2 cards and trash 2 cards from
 * your hand."
 *
 * Rules: the "If" has no colon, so it is a condition on the effect; only MY Characters count,
 * rested ones (Usopp himself is played active, CR 3-7-?; the Leader and DON!! are not Characters);
 * draw first, then trash exactly 2 (not "up to"): the trash may include the cards just drawn.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  L9,
  mayChooseNone,
  mine,
  need,
  pickCards,
  play,
  reachablePickSets,
  S9,
  trash,
  type Place,
} from './kit-op09a.ts';

const USOPP = 'OP09-024';

function start(own: Place[], p2: Place[] = [], extraHand: string[] = []): TestGame {
  const g = mine(
    L9.luffy,
    { hand: [USOPP, ...extraHand], deck: [S9.c6, S9.c7, ...fill(BLUE, 10)], characters: own },
    { characters: p2 },
  );
  play(g, g.find('p1', 'hand', USOPP));
  return g;
}

const R = (card: string): Place => ({ card, rested: true });

describe('OP09-024 Usopp: [On Play] with 2+ rested Characters, draw 2 and trash 2 from hand', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = start([]);
    const u = at(g, 'p1', 'characters', USOPP);
    expect(g.card(u).cost).toBe(4);
    expect(g.power(u)).toBe(5000);
    expect(g.card(u).counter).toBe(1000);
  });

  it('with 2 rested Characters: draws 2, then I trash exactly 2 cards from my hand', () => {
    const g = start([R(S9.c2), R(S9.c3)], [], [S9.c1]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([S9.c1, S9.c6, S9.c7].sort());
    expect(deck(g)).toHaveLength(10);
    pickCards(g, [S9.c1, S9.c6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c7]);
    expect(trash(g)).toEqual([S9.c1, S9.c6].sort());
  });

  it('the cards just drawn may be trashed', () => {
    const g = start([R(S9.c2), R(S9.c3)], [], [S9.c1]);
    need(g, 'choose', 'p1');
    // Every pair of the 3 cards in hand is a legal choice, including the two just drawn.
    const sets = reachablePickSets(g);
    for (const pair of [
      [S9.c1, S9.c6],
      [S9.c1, S9.c7],
      [S9.c6, S9.c7],
    ]) {
      expect(sets.has(pair.sort().join('+'))).toBe(true);
    }
    pickCards(g, [S9.c6, S9.c7]);
    expect(hand(g)).toEqual([S9.c1]);
    expect(trash(g)).toEqual([S9.c6, S9.c7].sort());
  });

  it('"trash 2" is exact: it cannot be skipped', () => {
    const g = start([R(S9.c2), R(S9.c3)], [], [S9.c1]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
  });

  it('boundary: only 1 rested Character (and one active) → nothing happens', () => {
    const g = start([R(S9.c2), S9.c3], [], [S9.c1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c1]);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
  });

  it('active Characters do not count: 3 active Characters → nothing', () => {
    const g = start([S9.c2, S9.c3, S9.c4], [], [S9.c1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('Usopp himself enters active, so he does not count: 1 other rested Character is not enough', () => {
    const g = start([R(S9.c2)], [], [S9.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('the opponent’s rested Characters do not count', () => {
    const g = start([R(S9.c2)], [R(S9.c3), R(S9.c4)], [S9.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('more than 2 rested Characters is fine (3 rested)', () => {
    const g = start([R(S9.c2), R(S9.c3), R(S9.c4)], [], [S9.c1]);
    need(g, 'choose', 'p1');
    pickCards(g, [S9.c6, S9.c7]);
    expect(hand(g)).toEqual([S9.c1]);
  });

  it('with an empty hand otherwise: draws 2 and must trash both', () => {
    const g = start([R(S9.c2), R(S9.c3)]);
    if (kind(g) === 'choose') pickCards(g, [S9.c6, S9.c7]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([S9.c6, S9.c7].sort());
  });

  it('must not happen: no card of the opponent is touched and my Life is unchanged', () => {
    const g = start([R(S9.c2), R(S9.c3)], [S9.c5], [S9.c1]);
    pickCards(g, [S9.c1, S9.c6]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
    expect(g.life('p1')).toBe(4);
  });
});
