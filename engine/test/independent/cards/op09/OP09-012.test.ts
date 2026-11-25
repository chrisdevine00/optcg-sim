/**
 * OP09-012 Monster (Character, Red, cost 3, 4000, Counter +1000, {Animal}/{Red-Haired Pirates}).
 *
 * Card text: "If your Character [Bonk Punch] would be K.O.'d by an effect, you may trash this
 * Character instead."
 *
 * Rules: a replacement effect (CR 8-1-3-4): "may" makes it optional, and when declined the K.O.
 * happens as written; it covers only K.O. BY AN EFFECT (RL-14: a battle K.O. is not by an effect);
 * it names a Character called [Bonk Punch] exactly (CR 2-1) and only while this card is on the
 * field; a replaced K.O. did not happen, so Bonk Punch stays (and no [On K.O.] fires); the
 * replacement trashes (not K.O.s) this Character.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  chars,
  hasEvent,
  kind,
  L9,
  need,
  no,
  opponentKOs,
  S9,
  SC2,
  theirs,
  trash,
  yes,
  type Place,
} from './kit-op09a.ts';

const MONSTER = 'OP09-012';
const BONK = 'OP09-010';

/** p2's turn: p2 holds `hand` (Gum-Gum Lightning K.O.s a 6000-or-less Character) and has DON!!; p1 has `own`. */
function defend(
  own: Place[],
  hand: string[] = [SC2.lightning],
  p2chars: Place[] = [S9.c3],
): TestGame {
  return theirs(L9.luffy, { characters: own }, { hand, characters: p2chars });
}

describe("OP09-012 Monster: if [Bonk Punch] would be K.O.'d by an effect, you may trash this Character instead", () => {
  it('printed values: cost 3, 4000, Counter +1000, types Animal and Red-Haired Pirates', () => {
    const g = defend([MONSTER]);
    const m = at(g, 'p1', 'characters', MONSTER);
    expect(g.card(m).cost).toBe(3);
    expect(g.power(m)).toBe(4000);
    expect(g.card(m).counter).toBe(1000);
  });

  it('an opposing effect K.O.s Bonk Punch: accepting trashes Monster instead and Bonk Punch stays', () => {
    const g = defend([BONK, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', BONK));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([BONK]);
    expect(trash(g)).toEqual([MONSTER]);
  });

  it('"you may": declining lets the K.O. happen as written; Monster stays', () => {
    const g = defend([BONK, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', BONK));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([MONSTER]);
    expect(trash(g)).toEqual([BONK]);
  });

  it('a replaced K.O. did not happen: no K.O. event is recorded for Bonk Punch', () => {
    const g = defend([BONK, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', BONK));
    yes(g, 'p1');
    expect(hasEvent(g, 'KO', { card: BONK })).toBe(false);
  });

  it('only [Bonk Punch] is covered: another Character K.O.d by the same kind of effect is simply K.O.d, with no offer', () => {
    const g = defend([S9.c3, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', S9.c3));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([MONSTER]);
    expect(trash(g)).toEqual([S9.c3]);
  });

  it('a K.O. in battle is not "by an effect": no replacement is offered and Bonk Punch is K.O.d', () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: BONK, rested: true }, MONSTER] },
      { characters: [S9.c5] },
    );
    attack(g, at(g, 'p2', 'characters', S9.c5), at(g, 'p1', 'characters', BONK));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([MONSTER]);
    expect(trash(g)).toEqual([BONK]);
  });

  it('with no Monster on the field Bonk Punch is simply K.O.d (a Monster in hand does not protect it)', () => {
    const g = defend([BONK]);
    opponentKOs(g, at(g, 'p1', 'characters', BONK));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BONK]);
  });

  it('with two Monsters on the field, one K.O. costs only one Monster', () => {
    const g = defend([BONK, MONSTER, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', BONK));
    // Each Monster has its own replacement, so the engine may ask which one; accept the first offer.
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([BONK, MONSTER].sort());
    expect(trash(g)).toEqual([MONSTER]);
  });

  it('Monster itself is not protected: K.O.d by an effect it is simply trashed', () => {
    const g = defend([BONK, MONSTER]);
    opponentKOs(g, at(g, 'p1', 'characters', MONSTER));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([BONK]);
    expect(trash(g)).toEqual([MONSTER]);
  });
});
