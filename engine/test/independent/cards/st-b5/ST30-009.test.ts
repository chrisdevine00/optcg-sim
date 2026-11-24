/**
 * ST30-009 LittleOars Jr. (Character, Red, cost 1, 2000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}).
 *
 * Card text: "If your Character with 6000 base power would be removed from the field by your
 * opponent's effect, you may trash this Character and draw 1 card instead."
 *
 * Rules: a replacement effect ("instead") is optional because of "may" (CR 8-1-3-4-1, RL-31),
 * "removed from the field" is any move off the field (CR 4-11-2), only the opponent's effects
 * count (a battle K.O. is not an effect), "6000 base power" ignores modifiers (CR 4-9-2) and is
 * exactly 6000 (RL-49), an impossible replacement cannot be applied (CR 8-1-3-4-5).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  deck,
  hand,
  hasEvent,
  kind,
  bounce,
  BOUNCE,
  KO_SRC,
  mine,
  need,
  no,
  squardKo,
  SL,
  theirs,
  trash,
  yes,
} from './kit-stb5a.ts';

const ID = 'ST30-009';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const KING = 'OP02-006'; // Red, cost 5, 7000
const MARCO = 'OP01-023'; // Red, cost 3, 5000
const THATCH = 'OP02-007'; // Red, cost 6, 8000
const DECK = ['OP01-010', 'OP01-012', ...Array(10).fill(BLUE)];

/** p2 plays Squard and K.O.s `victim`; p1 holds Oars and the victim (and anything in `more`). */
function koed(victim: string, more: string[] = []) {
  const g = theirs(
    SL.luffy,
    { characters: [ID, victim, ...more], deck: DECK },
    { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
  );
  squardKo(g, g.find('p1', 'characters', victim));
  return g;
}

const field = (g: ReturnType<typeof koed>) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe("ST30-009 LittleOars Jr.: replaces the removal of a 6000-base Character by the opponent's effect", () => {
  it('asks whether to replace when a 6000-base Character would be K.O.d by an opponent effect; yes saves it', () => {
    const g = koed(HAJ);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(field(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual(['OP01-010']);
    expect(deck(g)).toHaveLength(DECK.length - 1);
    expect(hasEvent(g, 'KO', { card: HAJ })).toBe(false);
  });

  it('declining: the Character is K.O.d, Oars stays on the field, nothing is drawn', () => {
    const g = koed(HAJ);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(field(g)).toEqual([ID]);
    expect(trash(g)).toEqual([HAJ]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('a Character with 7000 base power is not covered: K.O.d with no question', () => {
    const g = koed(KING);
    expect(kind(g)).toBe('main');
    expect(field(g)).toEqual([ID]);
    expect(trash(g)).toEqual([KING]);
  });

  it('a Character with 5000 base power is not covered either (exactly 6000)', () => {
    const g = koed(MARCO);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([MARCO]);
  });

  it('Oars itself (2000 base) is not covered: K.O.d with no question', () => {
    const g = theirs(
      SL.luffy,
      { characters: [ID, HAJ], deck: DECK },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
    );
    squardKo(g, g.find('p1', 'characters', ID));
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([ID]);
    expect(field(g)).toEqual([HAJ]);
  });

  it('without Oars on my field, a 6000-base Character is K.O.d normally', () => {
    const g = theirs(
      SL.luffy,
      { characters: [HAJ], deck: DECK },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
    );
    squardKo(g, g.find('p1', 'characters', HAJ));
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([HAJ]);
  });

  it('a K.O. in battle is not an effect: no replacement is offered', () => {
    const g = theirs(
      SL.luffy,
      { characters: [ID, { card: HAJ, rested: true }], deck: DECK },
      { characters: [THATCH] },
    );
    attack(g, g.find('p2', 'characters', THATCH), g.find('p1', 'characters', HAJ));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([HAJ]);
    expect(field(g)).toEqual([ID]);
  });

  it("my own effect is not the opponent's: bouncing my own 6000-base Character myself gets no replacement", () => {
    const g = mine(SL.luffy, { characters: [ID, HAJ], hand: [BOUNCE], deck: DECK });
    bounce(g, g.find('p1', 'characters', HAJ));
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([BOUNCE]);
    expect(field(g)).toEqual([ID]);
  });

  it("'removed from the field' covers a bounce by the opponent's effect: the replacement is offered and saves it", () => {
    const g = theirs(SL.luffy, { characters: [ID, HAJ], deck: DECK }, { hand: [BOUNCE] });
    bounce(g, g.find('p1', 'characters', HAJ));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(field(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual(['OP01-010']);
  });

  it('declining the replacement of a bounce: the Character returns to hand, Oars stays', () => {
    const g = theirs(SL.luffy, { characters: [ID, HAJ], deck: DECK }, { hand: [BOUNCE] });
    bounce(g, g.find('p1', 'characters', HAJ));
    no(g, 'p1');
    expect(field(g)).toEqual([ID]);
    expect(hand(g)).toEqual([HAJ]);
    expect(trash(g)).toEqual([]);
  });

  it('the replacement draws exactly 1 card from the top and the replacing Oars is trashed, not K.O.d', () => {
    const g = koed(HAJ);
    yes(g, 'p1');
    expect(hasEvent(g, 'KO', { card: ID })).toBe(false);
    expect(hand(g)).toHaveLength(1);
  });

  it('with two copies of Oars, the replacement trashes only one', () => {
    const g = koed(HAJ, [ID]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(field(g)).toEqual([HAJ, ID].sort());
  });
});
