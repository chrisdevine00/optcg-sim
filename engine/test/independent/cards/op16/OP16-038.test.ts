/**
 * OP16-038 Let's Go!! To the Navy Headquarters!! (Event, Green, cost 1, {Straw Hat Crew}/{Impel Down}).
 *
 * Card text: "[Main] You may rest 6 of your DON!! cards: If you have 5 {Impel Down} type Characters
 * with different card names, set your Leader and all of your Characters as active.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 8-3-3 (text after a failed "if" does not resolve),
 * CR 2-1-2 (card names), CR 7-1-5-3 (battle durations), RD 93 (Event [Counter]).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  answerMay,
  backAtMain,
  don,
  hand,
  ID,
  inst,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  payDon,
  put,
  rested,
  SCN,
  theirs,
  useCounter,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVT = 'OP16-038';
const R = (card: string) => ({ card, rested: true });
const FIVE = [ID.crocodile, ID.blugori, ID.sphinx, ID.saldeath, ID.jinbe];

function start(chars: string[], o: { active?: number; p2?: string[] } = {}) {
  return mine(
    R(LDR.luffy),
    {
      hand: [EVT],
      characters: chars.map(R),
      costArea: { active: o.active ?? 10, rested: 0 },
    },
    { characters: (o.p2 ?? []).map(R) },
  );
}
/** Play the Event, accept the cost, pay it with active DON!!. */
function fire(g: TestGame) {
  put(g, EVT);
  answerMay(g, true);
  payDon(g, 6, 'costActive');
}
/** Play the Event and pay if the engine lets me; the "if" decides what happens. */
function tryFire(g: TestGame) {
  put(g, EVT);
  if (answerMay(g, true)) payDon(g, 6, 'costActive');
}
const allRested = (g: TestGame) => g.zone('p1', 'characters').every((c) => c.rested);
const noneRested = (g: TestGame) => g.zone('p1', 'characters').every((c) => !c.rested);

describe("OP16-038 Let's Go!! To the Navy Headquarters!!: [Main] rest 6 DON!!: with 5 differently named {Impel Down} Characters, set Leader and Characters active", () => {
  it('5 {Impel Down} Characters with 5 different names: the Leader and all 5 Characters are set active', () => {
    const g = start(FIVE);
    expect(rested(g, g.leader('p1'))).toBe(true);
    fire(g);
    expect(backAtMain(g)).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(false);
    expect(noneRested(g)).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('pays the Event cost 1 plus the 6 rested DON!! (10 active -> 3 active, 7 rested)', () => {
    const g = start(FIVE);
    fire(g);
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
  });

  it('boundary: only 4 {Impel Down} Characters (all different names): nothing is set active', () => {
    const g = start(FIVE.slice(0, 4));
    tryFire(g);
    expect(backAtMain(g)).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(allRested(g)).toBe(true);
  });

  it('boundary: 5 {Impel Down} Characters but two share a name (OP02-053 and OP16-045 are both [Crocodile]): nothing is set active', () => {
    const g = start([ID.crocodile, 'OP16-045', ID.blugori, ID.sphinx, ID.saldeath]);
    tryFire(g);
    expect(backAtMain(g)).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(allRested(g)).toBe(true);
  });

  it('5 differently named Characters of which one is not {Impel Down} do not count: nothing is set active', () => {
    const g = start([ID.crocodile, ID.blugori, ID.sphinx, ID.saldeath, SCN.c3]);
    tryFire(g);
    expect(backAtMain(g)).toBe(true);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(allRested(g)).toBe(true);
  });

  it('the cost is exactly 6 DON!!: after the Event cost of 1, 5 active DON!! cannot pay it', () => {
    const g = start(FIVE, { active: 6 });
    put(g, EVT);
    mustBeUnpayable(g);
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(don(g)).toMatchObject({ active: 5, rested: 1 });
  });

  it('exactly 7 active DON!! is enough (1 for the Event, 6 for the cost)', () => {
    const g = start(FIVE, { active: 7 });
    fire(g);
    expect(noneRested(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 0, rested: 7 });
  });

  it('declining the optional cost: nothing is rested and nothing is set active', () => {
    const g = start(FIVE);
    put(g, EVT);
    answerMay(g, false);
    expect(backAtMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(allRested(g)).toBe(true);
  });

  it("must-not-happen: the opponent's rested Characters are not set active", () => {
    const g = start(FIVE, { p2: [SCN.c3] });
    fire(g);
    expect(noneRested(g)).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
  });

  it('[Counter]: the Leader gains +3000 during this battle (8000 holds off a 5000 attack) and it ends with the battle', () => {
    const g = theirs(LDR.luffy, { hand: [EVT], costArea: { active: 3, rested: 0 } }, {}, LDR.luffy);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });
});
