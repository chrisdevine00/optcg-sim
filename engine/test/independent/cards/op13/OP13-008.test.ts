/**
 * OP13-008 Emporio.Ivankov (Character, Red, cost 2, 3000, Counter +1000, {Revolutionary Army}, Special).
 *
 * Card text: "If your "Revolutionary Army" type Character would be K.O.'d by your opponent's effect,
 * you may trash this Character instead."
 *
 * Rules: CR 8-1-3-4 (a replacement effect; "may" makes it optional, and a declined replacement does
 * not resolve), CR 8-1-3-4-1. A K.O. by battle, or by the owner's own effect, is not covered.
 * Scenery: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less, DON!! -2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  charsOfIds,
  decision,
  kind,
  L13,
  mine,
  need,
  noDefence,
  no,
  opponentKOs,
  SC2,
  theirs,
  trash,
  V13,
  yes,
} from './kit-op13a.ts';

const IVAN = 'OP13-008';

/** p2's turn: p2 holds Lightning (twice), I (p1) have Ivankov and these Characters. */
function theirTurnBoard(
  chars: string[],
  hand: string[] = [],
  p2hand = [SC2.lightning, SC2.lightning],
) {
  return theirs(L13.luffy, { characters: chars, hand }, { hand: p2hand });
}

describe('OP13-008 Emporio.Ivankov: trash this instead of a Revolutionary Army Character K.O.d by the opponent', () => {
  it('printed values: cost 2, 3000, Counter +1000', () => {
    const g = theirTurnBoard([IVAN]);
    const c = g.card(at(g, 'p1', 'characters', IVAN));
    expect(c.cost).toBe(2);
    expect(c.power).toBe(3000);
    expect(c.counter).toBe(1000);
  });

  it('an opposing K.O. effect on my {Revolutionary Army} Character offers the replacement; accepting trashes Ivankov and the Character stays', () => {
    const g = theirTurnBoard([IVAN, V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([V13.koala]);
    expect(trash(g)).toEqual([IVAN]);
  });

  it('declining: the Character is K.O.d as printed and Ivankov stays', () => {
    const g = theirTurnBoard([IVAN, V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([IVAN]);
    expect(trash(g)).toEqual([V13.koala]);
  });

  it('a Character that is not {Revolutionary Army} gets no offer and is K.O.d', () => {
    const g = theirTurnBoard([IVAN, V13.marco]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.marco));
    expect(kind(g)).not.toBe('optional');
    expect(charsOfIds(g, 'p1')).toEqual([IVAN]);
    expect(trash(g)).toEqual([V13.marco]);
  });

  it('a K.O. in battle is not covered: no offer', () => {
    const g = theirs(
      L13.luffy,
      { characters: [IVAN, { card: V13.koala, rested: true }] },
      { characters: [V13.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', V13.thatch), at(g, 'p1', 'characters', V13.koala));
    noDefence(g);
    expect(decision(g)?.kind).toBe('main');
    expect(charsOfIds(g, 'p1')).toEqual([IVAN]);
    expect(trash(g)).toEqual([V13.koala]);
  });

  it('one K.O. is replaced once: with two Ivankovs on the field, accepting trashes only one of them', () => {
    const g = theirTurnBoard([IVAN, IVAN, V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    if (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(trash(g)).toEqual([IVAN]);
    expect(charsOfIds(g, 'p1')).toEqual([IVAN, V13.koala].sort());
  });

  it('with Ivankov in hand (not on the field) there is no replacement', () => {
    const g = theirTurnBoard([V13.koala], [IVAN]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    expect(kind(g)).not.toBe('optional');
    expect(charsOfIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([V13.koala]);
  });

  it('it covers my Characters only: p2 has Ivankov and a Revolutionary Army Character, p1 K.O.s a p1 Character of that type unasked', () => {
    // p2 owns Ivankov; p2's own Lightning on p1's Character must not ask p2 anything.
    const g = theirs(
      L13.luffy,
      { characters: [V13.koala] },
      { hand: [SC2.lightning], characters: [IVAN, V13.terry] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    expect(kind(g)).not.toBe('optional');
    expect(charsOfIds(g, 'p1')).toEqual([]);
    expect(charsOfIds(g, 'p2')).toEqual([IVAN, V13.terry].sort());
  });

  it("the other player's Ivankov protects its owner's Character from my effect (replacement offered to its owner)", () => {
    const g = mine(L13.luffy, { hand: [SC2.lightning] }, { characters: [IVAN, V13.koala] });
    opponentKOs(g, at(g, 'p2', 'characters', V13.koala));
    need(g, 'optional', 'p2');
    yes(g, 'p2');
    expect(charsOfIds(g, 'p2')).toEqual([V13.koala]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([IVAN]);
  });

  it('the replacement is spent with Ivankov: a second K.O. effect in the same turn is not replaced', () => {
    const g = theirTurnBoard([IVAN, V13.koala]);
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    yes(g, 'p1');
    opponentKOs(g, at(g, 'p1', 'characters', V13.koala));
    expect(kind(g)).not.toBe('optional');
    expect(charsOfIds(g, 'p1')).toEqual([]);
    expect(trash(g).sort()).toEqual([IVAN, V13.koala].sort());
  });
});
