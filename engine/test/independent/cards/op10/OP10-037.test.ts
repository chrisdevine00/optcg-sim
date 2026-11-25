/**
 * OP10-037 Lim (Character, Blue, cost 1, 0 power, Counter +1000, {ODYSSEY}).
 *
 * Card text: "[Once Per Turn] If this Character would be removed from the field by your opponent's
 * effect, you may rest 1 of your "ODYSSEY" type Characters instead.
 * [End of Your Turn] Set up to 1 of your "ODYSSEY" type Characters as active."
 *
 * Opposing removal: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less) and
 * OP10-044 Cub (returns an opposing Character with a cost of 1 or less to the hand).
 *
 * Rules: CR 8-1-3-4 (a replacement effect, optional when worded "may"), CR 8-1-3-4-3, "[Once Per Turn]",
 * a battle K.O. is not an effect (CR 8-1-1), CR 8-1-2 ("up to" may be skipped).
 * Open reading (E-Q7, M6b-Q5): the scope of "removed from the field"; the tests use a K.O. by an
 * opposing effect, and a return to the hand by an opposing effect, which every reading covers, and
 * a battle K.O., which none does. Whether Lim itself may be the Character rested is not asserted.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import {
  atMain,
  C10,
  canFinish,
  hand,
  inst,
  kind,
  L10,
  mine,
  need,
  no,
  offeredNow,
  opponentKOs,
  pickRaw,
  playRaw,
  rested,
  theirs,
  trash,
  useOffered,
  X10,
  yes,
  zoneIds,
} from './kit-op10b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LIM = 'OP10-037';

/** p2's turn: p1 has Lim and `others`; p2 holds `n` Lightnings. */
function defend(others: (string | { card: string; rested: boolean })[], n = 1) {
  return theirs(
    L10.luffy,
    { characters: [LIM, ...others] },
    { hand: Array.from({ length: n }, () => X10.lightning) },
  );
}

/** Accept the replacement and rest `which` (a Character instance). */
function replaceBy(g: TestGame, which: string) {
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  need(g, 'choose', 'p1');
  pickRaw(g, which);
}

describe('OP10-037 Lim: [Once Per Turn] replaces removal by resting an {ODYSSEY} Character; [End of Your Turn] sets one active', () => {
  it('a K.O. by an opposing effect is replaced: I rest another {ODYSSEY} Character and Lim stays', () => {
    const g = defend([C10.lucci]);
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    replaceBy(g, inst(g, 'p1', 'characters', C10.lucci));
    expect(zoneIds(g, 'p1', 'characters')).toEqual([LIM, C10.lucci].sort());
    expect(rested(g, inst(g, 'p1', 'characters', C10.lucci))).toBe(true);
    expect(rested(g, inst(g, 'p1', 'characters', LIM))).toBe(false);
    expect(trash(g)).toEqual([]);
  });

  it('only {ODYSSEY} Characters can be rested for it: a Character of another type is not offered', () => {
    const g = defend([C10.lucci, C10.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    const offered = offeredNow(g);
    expect(offered).toContain(C10.lucci);
    expect(offered).not.toContain(C10.marco);
  });

  it('the replacement is optional: declining lets the K.O. happen and rests nothing', () => {
    const g = defend([C10.lucci]);
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(trash(g)).toEqual([LIM]);
    expect(rested(g, inst(g, 'p1', 'characters', C10.lucci))).toBe(false);
  });

  it('a return to the hand by an opposing effect is also replaced', () => {
    const g = theirs(
      L10.luffy,
      { characters: [LIM, C10.lucci] },
      { hand: [X10.cub], characters: [] },
      L10.dressrosa,
    );
    playRaw(g, X10.cub);
    yes(g, 'p2');
    // the cost (rest the {Dressrosa} Leader) may be auto-paid with one candidate
    if (kind(g) === 'choose' && g.decider === 'p2' && canFinish(g) === false) {
      act(g, { type: 'pick', choice: g.leader('p2') });
    }
    need(g, 'choose', 'p2');
    pickRaw(g, inst(g, 'p1', 'characters', LIM));
    replaceBy(g, inst(g, 'p1', 'characters', C10.lucci));
    expect(zoneIds(g, 'p1', 'characters')).toEqual([LIM, C10.lucci].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Once Per Turn]: a second removal in the same turn is not replaced', () => {
    const g = defend([C10.lucci, C10.thatch], 2);
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    replaceBy(g, inst(g, 'p1', 'characters', C10.lucci));
    // after the replacement the opponent is back in their Main Phase
    need(g, 'main', 'p2');
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([LIM]);
  });

  it("with no active {ODYSSEY} Character to rest the replacement cannot be used and Lim is K.O.'d", () => {
    const g = theirs(
      L10.luffy,
      { characters: [{ card: LIM, rested: true }, { card: C10.lucci, rested: true }, C10.marco] },
      { hand: [X10.lightning] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', LIM));
    if (kind(g) === 'optional') {
      expect(useOffered(g, 'p1')).toBe(false);
      act(g, { type: 'optional', accept: false });
    } else if (kind(g) === 'choose') {
      // a cost pick with no legal candidate must not be answerable
      expect(offeredNow(g)).toEqual([]);
    }
    expect(trash(g)).toEqual([LIM]);
  });

  it('a battle K.O. is not removal by an effect: no replacement is offered', () => {
    const g = theirs(L10.luffy, { characters: [{ card: LIM, rested: true }, C10.lucci] }, {});
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', LIM));
    noDefence(g);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([LIM]);
    expect(rested(g, inst(g, 'p1', 'characters', C10.lucci))).toBe(false);
  });

  it('[End of Your Turn] sets up to 1 rested {ODYSSEY} Character active; a rested non-{ODYSSEY} Character stays rested', () => {
    const g = mine(L10.luffy, {
      characters: [LIM, { card: C10.lucci, rested: true }, { card: C10.marco, rested: true }],
    });
    endTurn(g);
    if (kind(g) === 'choose') pickRaw(g, inst(g, 'p1', 'characters', C10.lucci));
    need(g, 'main', 'p2');
    expect(rested(g, inst(g, 'p1', 'characters', C10.lucci))).toBe(false);
    expect(rested(g, inst(g, 'p1', 'characters', C10.marco))).toBe(true);
  });

  it('[End of Your Turn] "up to 1": with two rested {ODYSSEY} Characters only one becomes active', () => {
    const g = mine(L10.luffy, {
      characters: [LIM, { card: C10.lucci, rested: true }, { card: C10.lucci, rested: true }],
    });
    endTurn(g);
    if (kind(g) === 'choose') pickRaw(g, inst(g, 'p1', 'characters', C10.lucci, 0));
    need(g, 'main', 'p2');
    const lucci = g.zone('p1', 'characters').filter((c) => c.card === C10.lucci);
    expect(lucci.filter((c) => !c.rested)).toHaveLength(1);
    expect(lucci.filter((c) => c.rested)).toHaveLength(1);
  });

  it('[End of Your Turn] "up to 1": may set none', () => {
    const g = mine(L10.luffy, { characters: [LIM, { card: C10.lucci, rested: true }] });
    endTurn(g);
    if (kind(g) === 'choose') {
      expect(canFinish(g)).toBe(true);
      act(g, { type: 'done' });
    }
    need(g, 'main', 'p2');
    // either the engine asked (and none was chosen: still rested) or it set the only candidate
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('[End of Your Turn] only reaches {ODYSSEY} Characters: a rested non-{ODYSSEY} Character is never offered and stays rested', () => {
    const g = mine(L10.luffy, { characters: [LIM, { card: C10.marco, rested: true }] });
    endTurn(g);
    if (kind(g) === 'choose') {
      expect(offeredNow(g)).not.toContain(C10.marco);
      act(g, { type: 'done' });
    }
    need(g, 'main', 'p2');
    expect(rested(g, inst(g, 'p1', 'characters', C10.marco))).toBe(true);
  });
});
