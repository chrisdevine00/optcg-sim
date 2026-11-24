/**
 * ST30-006 Jinbe (Character, Red, cost 5, 6000, Counter +1000, {Fish-Man}/{The Sun Pirates}/{Impel Down}).
 *
 * Card text: "[On Play] You may trash 1 Character card with 6000 power from your hand: Draw 2 cards."
 *
 * Rules: "6000 power" is exactly 6000 (RL-49), a cost that cannot be paid cannot be paid (CR
 * 8-3-1-3), skipping a "may" cost means the effect does not activate (CR 8-3-1-4), trashing from
 * hand is not a K.O. and a trashed card is not revealed, "Draw 2" is not optional (CR 4-5-3).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  deck,
  don,
  hand,
  hasEvent,
  mine,
  need,
  no,
  offeredIds,
  payHandIfAsked,
  playCardRaw,
  SL,
  trash,
  unusable,
  yes,
} from './kit-stb5a.ts';

const ID = 'ST30-006';
const HAJ = 'OP01-018'; // Red, 6000
const JIL = 'OP03-006'; // Red, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const DECK = ['OP01-010', 'OP01-012', 'OP01-043', ...Array(10).fill(BLUE)];

function start(inHand: string[], deckCards: string[] = DECK) {
  const g = mine(SL.luffy, { hand: [ID, ...inHand], deck: deckCards });
  playCardRaw(g, ID);
  return g;
}

describe('ST30-006 Jinbe: [On Play] you may trash 1 Character with 6000 power: draw 2', () => {
  it('offers exactly the Characters with exactly 6000 power (not 7000, not 5000)', () => {
    const g = start([HAJ, JIL, KING, MARCO]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, JIL].sort());
  });

  it('paying trashes the chosen card and draws 2 from the top of the deck', () => {
    const g = start([HAJ, JIL, KING]);
    yes(g, 'p1');
    payHandIfAsked(g, [JIL]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([JIL]);
    expect(hand(g)).toEqual([HAJ, KING, 'OP01-010', 'OP01-012'].sort());
    expect(deck(g)).toHaveLength(DECK.length - 2);
    expect(deck(g)[0]).toBe('OP01-043');
  });

  it('with no 6000-power Character in hand (7000 and 5000 only) the cost cannot be paid: no draw', () => {
    const g = start([KING, MARCO]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KING, MARCO].sort());
    expect(deck(g)).toHaveLength(DECK.length);
    expect(trash(g)).toEqual([]);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = start([]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('declining the "you may" trashes and draws nothing, and Jinbe is still played', () => {
    const g = start([HAJ]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(hand(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a second Jinbe (6000 power) in hand is a valid cost card', () => {
    const g = start([ID]);
    yes(g, 'p1');
    payHandIfAsked(g, [ID]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toHaveLength(2);
  });

  it('exactly 1 card is trashed even with two candidates, and the other candidate stays in hand', () => {
    const g = start([HAJ, JIL]);
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(trash(g)).toEqual([HAJ]);
    expect(hand(g)).toContain(JIL);
  });

  it('the trashed card is not revealed and is not K.O.d', () => {
    const g = start([HAJ]);
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(hasEvent(g, 'CardRevealed', { card: HAJ })).toBe(false);
    expect(hasEvent(g, 'KO')).toBe(false);
  });

  it('costs 5 DON!! to play whether or not the effect is used', () => {
    const g = start([]);
    unusable(g, 'p1');
    expect(don(g).rested).toBe(5);
    expect(don(g).active).toBe(5);
  });
});
