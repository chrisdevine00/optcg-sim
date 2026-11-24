/**
 * OP17-010 Fossa (Character, Red, cost 1, 3000, no Counter, {Whitebeard Pirates}, Slash).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If your opponent has a Character with 10000 power or more
 * and you have no other [Fossa], this Character gains [Blocker] and +2000 power until the end of your
 * opponent's next End Phase."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve), CR 10-2-13 ([Once Per Turn]), RL-11
 * ("until the end of your opponent's next End Phase"), CR 10-1-4 ([Blocker]), exact names (CR 2-1-2).
 */
import { describe, expect, it } from 'vitest';
import { blockers } from '../../helpers.ts';
import {
  abilities,
  activate,
  attack,
  canActivate,
  cp,
  endTurn,
  expectMain,
  LD,
  mine,
  SC2,
  settleYes,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FOSSA = 'OP17-010';
const blocker = (g: TestGame, nth = 0) =>
  g.card(g.find('p1', 'characters', FOSSA, nth)).keywords.includes('Blocker');

function setup(opp: string[], own: string[] = []) {
  return mine(LD.luffy, { characters: [FOSSA, ...own] }, { characters: opp });
}
/** Activate if the engine offers it; the effect's own "if" decides whether anything happens. */
function tryUse(g: TestGame, nth = 0) {
  const fossa = g.find('p1', 'characters', FOSSA, nth);
  if (abilities(g, fossa).length) {
    activate(g, fossa);
    settleYes(g, 'p1');
  }
}

describe('OP17-010 Fossa: [Activate: Main] [Once Per Turn] if the opponent has a 10000+ Character and no other [Fossa]: [Blocker] and +2000', () => {
  it('with an opposing 10000-power Character: gains [Blocker] and +2000 (5000)', () => {
    const g = setup([SC2.shanksP016]);
    expect(canActivate(g, g.find('p1', 'characters', FOSSA))).toBe(true);
    activate(g, g.find('p1', 'characters', FOSSA));
    expectMain(g);
    expect(blocker(g)).toBe(true);
    expect(cp(g, 'p1', FOSSA)).toBe(5000);
  });

  it('boundary: a 9000-power opposing Character is not enough: no [Blocker], no power', () => {
    const g = setup([WB.littleOars]);
    tryUse(g);
    expect(blocker(g)).toBe(false);
    expect(cp(g, 'p1', FOSSA)).toBe(3000);
  });

  it('a 12000-power opposing Character also qualifies', () => {
    const g = setup([SC2.xebec]);
    activate(g, g.find('p1', 'characters', FOSSA));
    expect(cp(g, 'p1', FOSSA)).toBe(5000);
  });

  it('with no opposing Character nothing happens', () => {
    const g = setup([]);
    tryUse(g);
    expect(blocker(g)).toBe(false);
    expect(cp(g, 'p1', FOSSA)).toBe(3000);
  });

  it('the 10000-power Character must be the opponent’s: my own does not count', () => {
    const g = setup([], [SC2.shanksP016]);
    tryUse(g);
    expect(cp(g, 'p1', FOSSA)).toBe(3000);
  });

  it('CR 8-3-3: with another [Fossa] on my field the effect does nothing', () => {
    const g = mine(LD.luffy, { characters: [FOSSA, FOSSA] }, { characters: [SC2.shanksP016] });
    tryUse(g, 0);
    expect(cp(g, 'p1', FOSSA, 0)).toBe(3000);
    expect(blocker(g, 0)).toBe(false);
  });

  it('an opposing [Fossa] is not "your" other [Fossa]: it does not stop the effect', () => {
    const g = setup([SC2.shanksP016, FOSSA]);
    activate(g, g.find('p1', 'characters', FOSSA));
    expect(cp(g, 'p1', FOSSA)).toBe(5000);
  });

  it('RL-11: lasts through the opponent’s next turn and ends at the end of the opponent’s End Phase', () => {
    const g = setup([SC2.shanksP016]);
    activate(g, g.find('p1', 'characters', FOSSA));
    endTurn(g);
    expect(cp(g, 'p1', FOSSA)).toBe(5000);
    expect(blocker(g)).toBe(true);
    endTurn(g);
    expectMain(g, 'p1');
    expect(cp(g, 'p1', FOSSA)).toBe(3000);
    expect(blocker(g)).toBe(false);
  });

  it('the [Blocker] really blocks on the opponent’s turn', () => {
    const g = setup([SC2.shanksP016, WB.kingdew]);
    activate(g, g.find('p1', 'characters', FOSSA));
    endTurn(g);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', FOSSA)]);
  });

  it('CR 10-2-13: [Once Per Turn]: not offered a second time in the same turn', () => {
    const g = setup([SC2.shanksP016]);
    activate(g, g.find('p1', 'characters', FOSSA));
    expect(canActivate(g, g.find('p1', 'characters', FOSSA))).toBe(false);
  });
});
