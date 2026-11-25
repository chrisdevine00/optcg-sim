/**
 * OP10-074 Pica (Character, Purple, cost 4, 5000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[Once Per Turn] If this Character would be K.O.'d by your opponent's effect, you may rest 2 of
 * your active DON!! cards instead."
 *
 * Opposing removal: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less) and
 * OP10-046 Kyros ([On Play] returns a Character with a cost of 5 or less to the hand).
 *
 * Rules: CR 8-1-3-4 (a replacement effect, optional when worded "may"), "[Once Per Turn]", only ACTIVE
 * DON!! can be rested for the cost, only a K.O. by an opponent's effect is replaced (a battle K.O. is not
 * an effect, a return to the hand is not a K.O.), CR 8-1-3-4-3.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  C10,
  canUse,
  donSum,
  hand,
  inst,
  kind,
  L10,
  need,
  no,
  opponentKOs,
  payDon,
  pickRaw,
  playRaw,
  rested,
  theirs,
  trash,
  X10,
  yes,
  zoneIds,
} from './kit-op10b.ts';

const PICA = 'OP10-074';

function defend(
  p1chars: (string | { card: string; rested: boolean })[] = [],
  don = { active: 4, rested: 0 },
  lightnings = 1,
): TestGame {
  return theirs(
    L10.dp,
    { characters: [PICA, ...p1chars], costArea: don },
    { hand: Array.from({ length: lightnings }, () => X10.lightning) },
  );
}

describe('OP10-074 Pica: [Once Per Turn] replaces a K.O. by an opposing effect by resting 2 active DON!!', () => {
  it('a K.O. by an opposing effect is replaced: 2 active DON!! are rested and Pica stays', () => {
    const g = defend();
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 2, 'costActive');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([PICA]);
    expect(trash(g)).toEqual([]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 2 });
  });

  it('boundary: exactly 2 active DON!! is enough', () => {
    const g = defend([], { active: 2, rested: 0 });
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 2, 'costActive');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([PICA]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
  });

  it("the replacement is optional: declining lets Pica be K.O.'d and rests no DON!!", () => {
    const g = defend();
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    no(g, 'p1');
    expect(trash(g)).toEqual([PICA]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it("with only 1 active DON!! the cost cannot be paid and Pica is K.O.'d", () => {
    const g = defend([], { active: 1, rested: 3 });
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    if (kind(g) === 'optional') {
      expect(canUse(g)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(trash(g)).toEqual([PICA]);
  });

  it('rested DON!! do not count: 0 active and 4 rested cannot pay', () => {
    const g = defend([], { active: 0, rested: 4 });
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    if (kind(g) === 'optional') {
      expect(canUse(g)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(trash(g)).toEqual([PICA]);
  });

  it('[Once Per Turn]: a second K.O. of Pica in the same turn is not replaced', () => {
    const g = defend([], { active: 6, rested: 0 }, 2);
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    yes(g, 'p1');
    payDon(g, 2, 'costActive');
    need(g, 'main', 'p2');
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([PICA]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });

  it("only Pica himself is protected: another Character K.O.'d by the opponent gets no replacement", () => {
    const g = defend([C10.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', C10.marco));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C10.marco]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([PICA]);
  });

  it("a battle K.O. is not an effect: a rested Pica attacked and K.O.'d is trashed with no replacement", () => {
    const g = theirs(
      L10.dp,
      { characters: [{ card: PICA, rested: true }], costArea: { active: 4, rested: 0 } },
      { characters: [C10.kingdew] },
    );
    attack(g, inst(g, 'p2', 'characters', C10.kingdew), inst(g, 'p1', 'characters', PICA));
    noDefence(g);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([PICA]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('a return to the hand by an opposing effect is not a K.O.: it is not replaced', () => {
    const g = theirs(
      L10.dp,
      { characters: [PICA], costArea: { active: 4, rested: 0 } },
      { hand: ['OP10-046'], costArea: { active: 10, rested: 0 } },
    );
    playRaw(g, 'OP10-046');
    need(g, 'choose', 'p2');
    pickRaw(g, inst(g, 'p1', 'characters', PICA));
    expect(kind(g)).not.toBe('optional');
    expect(hand(g, 'p1')).toEqual([PICA]);
    expect(donSum(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('a rested Pica is protected as well, and stays rested after the replacement', () => {
    const g = theirs(
      L10.dp,
      { characters: [{ card: PICA, rested: true }], costArea: { active: 4, rested: 0 } },
      { hand: [X10.lightning] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', PICA));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 2, 'costActive');
    expect(rested(g, inst(g, 'p1', 'characters', PICA))).toBe(true);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([PICA]);
  });
});
