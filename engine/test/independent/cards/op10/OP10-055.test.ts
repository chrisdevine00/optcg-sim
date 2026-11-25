/**
 * OP10-055 Marco (Character, Blue, cost 3, 5000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[Blocker] [On K.O.] Return up to 1 of your opponent's Characters with a cost of 4 or less
 * to the owner's hand."
 *
 * Rules: [Blocker] (CR 10-1-4), [On K.O.] activates when this Character is K.O.'d, by battle or by
 * an effect (CR 10-2-... ), "up to" may be 0 (CR 8-1-2), a cost of 4 or less includes 4.
 * Scenery: OP02-006 Kingdew (cost 5, 7000) as the attacker; OP09-077 Gum-Gum Lightning (K.O. 6000 or less).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  block,
  C10,
  doneRaw,
  expectMain,
  hand,
  inst,
  kind,
  kw,
  L10,
  mine,
  need,
  offeredNow,
  opponentKOs,
  pickRaw,
  playRaw,
  theirs,
  trash,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const MARCO = 'OP10-055';

/** p2's turn: Kingdew (7000) attacks my Leader; I have Marco and `p1chars`; p2 also has `p2chars`. */
function ambush(
  p2chars: string[] = [C10.mohji, C10.hajrudin4, C10.kingdew],
  p1chars: string[] = [],
) {
  const g = theirs(L10.luffy, { characters: [MARCO, ...p1chars] }, { characters: p2chars });
  attack(g, inst(g, 'p2', 'characters', C10.kingdew), g.leader('p1'));
  need(g, 'block', 'p1');
  block(g, inst(g, 'p1', 'characters', MARCO));
  need(g, 'counter', 'p1');
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP10-055 Marco: [Blocker]; [On K.O.] return up to 1 opposing Character with a cost of 4 or less', () => {
  it('has [Blocker] and, played from hand, asks nothing (no [On Play])', () => {
    const g = mine(L10.luffy, { hand: [MARCO] }, { characters: [C10.mohji] });
    playRaw(g, MARCO);
    expectMain(g);
    expect(kw(g, inst(g, 'p1', 'characters', MARCO))).toContain('Blocker');
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });

  it("K.O.'d in battle while blocking: asks for a target and returns the chosen cost-4 Character to its owner's hand", () => {
    const g = ambush();
    need(g, 'choose', 'p1');
    expect(trash(g)).toEqual([MARCO]);
    pickRaw(g, inst(g, 'p2', 'characters', C10.hajrudin4));
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.hajrudin4]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.kingdew, C10.mohji].sort());
  });

  it('boundary: costs 1 and 4 are offered; the cost-5 attacker is not', () => {
    const g = ambush();
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hajrudin4, C10.mohji].sort());
  });

  it('only opposing Characters are offered: my own cost-1 Character is not', () => {
    const g = ambush([C10.mohji, C10.kingdew], [C10.gordon]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it('"up to 1": choosing nothing returns nothing', () => {
    const g = ambush();
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([]);
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('only one Character is returned even when several qualify', () => {
    const g = ambush();
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
    expect(zoneIds(g, 'p2', 'characters')).toContain(C10.hajrudin4);
  });

  it('it also fires when an opposing effect K.O.s Marco (Gum-Gum Lightning)', () => {
    const g = theirs(
      L10.luffy,
      { characters: [MARCO] },
      { hand: [X10.lightning], characters: [C10.mohji] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', MARCO));
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.mohji]);
    expect(trash(g)).toEqual([MARCO]);
  });

  it("it does not fire when Marco is not K.O.'d: blocking a weaker attacker (3000) only rests him", () => {
    const g = theirs(L10.luffy, { characters: [MARCO] }, { characters: [C10.gordon, C10.mohji] });
    attack(g, inst(g, 'p2', 'characters', C10.gordon), g.leader('p1'));
    need(g, 'block', 'p1');
    block(g, inst(g, 'p1', 'characters', MARCO));
    noDefence(g);
    expect(kind(g)).not.toBe('choose');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([MARCO]);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([]);
  });

  it("it does not fire when Marco leaves by being returned to the hand instead of K.O.'d (Kyros)", () => {
    const g = mine(
      L10.luffy,
      { hand: ['OP10-046'], characters: [MARCO] },
      { characters: [C10.mohji] },
    );
    playRaw(g, 'OP10-046');
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p1', 'characters', MARCO));
    expect(kind(g)).not.toBe('choose');
    expect(hand(g, 'p1')).toEqual([MARCO]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });
});
