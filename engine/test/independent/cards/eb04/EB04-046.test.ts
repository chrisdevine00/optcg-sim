/**
 * EB04-046 Doll (Character, Black, cost 2, 1000, Counter +1000, {Navy}/{Egghead}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Opponent's Turn] All of your {Navy} type Characters gain +2 cost."
 *
 * Rules: "[Opponent's Turn]" applies only during the opponent's turn. The +2 applies to the current
 * cost of every {Navy} Character of the controller (Doll herself is {Navy}); each Doll adds its own
 * +2. Only Characters on the field are affected. Current cost is what "a cost of N or less" checks.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  BLUE,
  costOf,
  endTurn,
  fill,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  opponentKOs,
  passBlock,
  theirs,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-046';
/** OP02-097 Komille: Black, cost 1, 3000, {Navy}. */
const KOMILLE = 'OP02-097';
/** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}/{East Blue}. */
const TASHIGI = 'EB05-015';
/** OP01-012 Sai: Red, cost 2, 4000, no Navy type. */
const SAI = 'OP01-012';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const ICE = 'EB04-028'; // Blue Event, [Trigger] return up to 1 Character with a cost of 5 or less

function opp(own: string[]): TestGame {
  return theirs(
    LB.navy,
    { characters: own, deck: fill(BLUE, 10), life: fill(BLUE, 4) },
    { characters: [HAJ] },
  );
}

describe("EB04-046 Doll: [Opponent's Turn] your {Navy} Characters gain +2 cost", () => {
  it("on the opponent's turn every {Navy} Character of yours has +2 cost, Doll included", () => {
    const g = opp([ID, KOMILLE, TASHIGI]);
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(3);
    expect(costOf(g, at(g, 'p1', 'characters', TASHIGI))).toBe(7);
    expect(costOf(g, at(g, 'p1', 'characters', ID))).toBe(4);
  });

  it('on your own turn there is no bonus', () => {
    const g = mine(LB.navy, { characters: [ID, KOMILLE] }, {});
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(1);
    expect(costOf(g, at(g, 'p1', 'characters', ID))).toBe(2);
  });

  it('the bonus appears when the turn passes to the opponent and goes when it comes back', () => {
    const g = mine(
      LB.navy,
      { characters: [ID, KOMILLE], deck: fill(BLUE, 10) },
      { deck: fill(BLUE, 10) },
    );
    endTurn(g);
    need(g, 'main', 'p2');
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(3);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(1);
  });

  it('Characters without the {Navy} type are not affected', () => {
    const g = opp([ID, SAI]);
    expect(costOf(g, at(g, 'p1', 'characters', SAI))).toBe(2);
  });

  it("the opponent's Characters are not affected", () => {
    const g = opp([ID]);
    expect(costOf(g, at(g, 'p2', 'characters', HAJ))).toBe(4);
  });

  it('two Dolls stack: +2 from each', () => {
    const g = opp([ID, ID, KOMILLE]);
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(5);
  });

  it('matters for cost checks: during the opponent turn a {Navy} Character of cost 4 is no longer a cost-5-or-less target of Ice Time [Trigger]', () => {
    const g = theirs(
      LB.navy,
      { characters: [ID, TASHIGI, SAI], life: [ICE, BLUE, BLUE, BLUE], deck: fill(BLUE, 10) },
      { characters: ['OP02-006'] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-006'), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    // Tashigi is 5 +2 = 7 and Doll 2 +2 = 4. Sai (not Navy) stays 2, Kingdew (opp) 5.
    expect(offeredIds(g)).toEqual([ID, SAI, 'OP02-006'].sort());
    none(g);
  });

  it('[Blocker]: Doll can block an attack on the Leader', () => {
    const g = opp([ID]);
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('once Doll leaves the field the bonus is gone', () => {
    const g = theirs(
      LB.navy,
      { characters: [ID, KOMILLE], deck: fill(BLUE, 10), life: fill(BLUE, 4) },
      { hand: ['OP09-077'] },
    );
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(3);
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    expect(kind(g)).toBe('main');
    expect(costOf(g, at(g, 'p1', 'characters', KOMILLE))).toBe(1);
  });
});
