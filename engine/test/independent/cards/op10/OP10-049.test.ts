/**
 * OP10-049 Sabo (Character, Blue, cost 4, 5000, Counter +2000, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If your Character with a base cost of 7 or less other than [Sabo] would be removed from the
 * field by your opponent's effect, you may return this Character to the owner's hand instead."
 *
 * Opposing removal: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less).
 * Scenery: OP07-002 Ain (base cost 7, 6000), OP15-086 Nami (base cost 8, 6000), OP01-023 Marco (cost 3, 5000).
 *
 * Rules: CR 8-1-3-4 (a replacement effect, optional when worded "may"), CR 8-1-3-4-3 (a replacement
 * applies once to a given event), a battle K.O. is not an effect (CR 8-1-1), "base cost" ignores
 * modifiers, "other than [Sabo]" excludes every card named Sabo, "your opponent's effect" excludes my own.
 * Open reading (E-Q7, M6b-Q5): the scope of "removed from the field"; the tests use a K.O. by an opposing
 * effect (every reading) and a battle K.O. (no reading).
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  C10,
  hand,
  inst,
  kind,
  L10,
  mine,
  need,
  no,
  opponentKOs,
  pickRaw,
  playRaw,
  theirs,
  trash,
  X10,
  yes,
  zoneIds,
} from './kit-op10b.ts';

const SABO = 'OP10-049';
const AIN = 'OP07-002';
const NAMI = 'OP15-086';

function defend(others: (string | { card: string; rested: boolean })[], n = 1, sabos = 1) {
  return theirs(
    L10.luffy,
    { characters: [...Array.from({ length: sabos }, () => SABO), ...others] },
    { hand: Array.from({ length: n }, () => X10.lightning) },
  );
}

describe('OP10-049 Sabo: replaces the removal of my other base-cost-7-or-less Characters by returning Sabo to the hand', () => {
  it('an opposing K.O. of Marco (cost 3) is replaced: Sabo returns to my hand and Marco stays', () => {
    const g = defend([C10.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', C10.marco));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.marco]);
    expect(hand(g, 'p1')).toEqual([SABO]);
    expect(trash(g)).toEqual([]);
  });

  it("the replacement is optional: declining lets Marco be K.O.'d and Sabo stays on the field", () => {
    const g = defend([C10.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', C10.marco));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(trash(g)).toEqual([C10.marco]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SABO]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('boundary: a Character with a base cost of 7 (Ain) is covered', () => {
    const g = defend([AIN]);
    opponentKOs(g, inst(g, 'p1', 'characters', AIN));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([AIN]);
    expect(hand(g, 'p1')).toEqual([SABO]);
  });

  it('boundary: a Character with a base cost of 8 (Nami) is not covered: no replacement is offered', () => {
    const g = defend([NAMI]);
    opponentKOs(g, inst(g, 'p1', 'characters', NAMI));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([NAMI]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SABO]);
  });

  it('"other than [Sabo]": Sabo himself being K.O.\'d is not replaced', () => {
    const g = defend([C10.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', SABO));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SABO]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.marco]);
  });

  it('"other than [Sabo]" is by name: a second Sabo K.O.\'d by the opponent is not covered by the first', () => {
    const g = defend([], 1, 2);
    opponentKOs(g, inst(g, 'p1', 'characters', SABO, 0));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SABO]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SABO]);
  });

  it('with no Sabo on the field the K.O. just happens', () => {
    const g = theirs(L10.luffy, { characters: [C10.marco] }, { hand: [X10.lightning] });
    opponentKOs(g, inst(g, 'p1', 'characters', C10.marco));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C10.marco]);
  });

  it('a battle K.O. is not an effect: no replacement is offered', () => {
    const g = theirs(L10.luffy, { characters: [SABO, { card: C10.marco, rested: true }] }, {});
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', C10.marco));
    noDefence(g);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C10.marco]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SABO]);
  });

  it('my own effect does not trigger it: I return my own Marco with Kyros ([On Play]) and no replacement is offered', () => {
    const g = mine(L10.luffy, { hand: ['OP10-046'], characters: [SABO, C10.marco] });
    playRaw(g, 'OP10-046');
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p1', 'characters', C10.marco));
    expect(kind(g)).not.toBe('optional');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SABO, 'OP10-046'].sort());
    expect(hand(g, 'p1')).toEqual([C10.marco]);
  });

  it('once Sabo has been returned to the hand a second removal in the same turn is not replaced', () => {
    const g = defend([C10.marco, C10.sai], 2);
    opponentKOs(g, inst(g, 'p1', 'characters', C10.marco));
    yes(g, 'p1');
    need(g, 'main', 'p2');
    opponentKOs(g, inst(g, 'p1', 'characters', C10.sai));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C10.sai]);
  });
});
