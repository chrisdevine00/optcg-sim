/**
 * OP15-086 Nami (Character, Black, cost 8, 6000, no Counter, {Straw Hat Crew}).
 *
 * Card text:
 *   "[On Play] If your Leader has the {Straw Hat Crew} type, play up to 1 {Straw Hat Crew} type Character
 *    with a cost of 7 or less from your trash. The Character played with this effect gains [Rush] during
 *    this turn."
 *
 * Rules relied on: CR 8-3-3 (condition gates the effect), "up to" may choose nothing, CR 10-1-1
 * ([Rush]), CR 3-7-4 (a Character played this turn cannot attack without [Rush]), "during this turn"
 * ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canAttackAnything,
  chars,
  hand,
  kw,
  LD15,
  mayChooseNone,
  mine,
  need,
  offeredIds,
  pickCards,
  playIt,
  reachablePickSets,
  SC15,
  skipChoice,
  toMyNextMain,
  trash,
} from './kit-op15c.ts';

const NAMI = 'OP15-086';
const TRASH = [SC15.shc6, SC15.shc7, SC15.shc8, SC15.red6, SC15.shc1];

function start(leader: string = LD15.shc, trashCards: string[] = TRASH) {
  const g = mine(leader, { hand: [NAMI], trash: trashCards });
  playIt(g, NAMI);
  return g;
}

describe('OP15-086 Nami [On Play]', () => {
  it('offers only {Straw Hat Crew} Characters with cost 7 or less: cost 7 yes (boundary), cost 8 and non-{Straw Hat Crew} no', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.shc1, SC15.shc6, SC15.shc7].sort());
  });

  it('plays the chosen Character from the trash onto the field, active', () => {
    const g = start();
    pickCards(g, [SC15.shc7]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([NAMI, SC15.shc7].sort());
    expect(g.card(at(g, 'p1', 'characters', SC15.shc7)).rested).toBe(false);
    expect(trash(g)).toEqual([SC15.shc1, SC15.shc6, SC15.shc8, SC15.red6].sort());
  });

  it('the Character played with this effect gains [Rush] and can attack at once', () => {
    const g = start();
    pickCards(g, [SC15.shc6]);
    const z = at(g, 'p1', 'characters', SC15.shc6);
    expect(kw(g, z)).toContain('Rush');
    expect(canAttackAnything(g, z)).toBe(true);
  });

  it('Nami herself does not gain [Rush] and cannot attack (played this turn)', () => {
    const g = start();
    pickCards(g, [SC15.shc6]);
    const n = at(g, 'p1', 'characters', NAMI);
    expect(kw(g, n)).not.toContain('Rush');
    expect(canAttackAnything(g, n)).toBe(false);
  });

  it('[Rush] lasts only this turn: on my next turn the Character has no [Rush]', () => {
    const g = start();
    pickCards(g, [SC15.shc6]);
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', SC15.shc6))).not.toContain('Rush');
  });

  it('"up to 1": may play nothing; the trash is untouched', () => {
    const g = start();
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(chars(g)).toEqual([NAMI]);
    expect(trash(g)).toEqual([...TRASH].sort());
  });

  it('plays at most one Character even when several qualify', () => {
    const g = start();
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('without a {Straw Hat Crew} Leader nothing is played', () => {
    const g = start(LD15.neutral);
    if (g.legal().some((a) => a.type === 'done')) skipChoice(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([NAMI]);
    expect(trash(g)).toEqual([...TRASH].sort());
  });

  it('with no qualifying Character in the trash nothing happens and nothing hangs', () => {
    const g = start(LD15.shc, [SC15.shc8, SC15.red6]);
    if (g.legal().some((a) => a.type === 'done')) skipChoice(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([NAMI]);
    expect(hand(g)).toEqual([]);
  });
});
