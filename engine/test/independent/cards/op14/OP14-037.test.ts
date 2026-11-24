/**
 * OP14-037 For Fun (Event, Green, cost 1, {The Seven Warlords of the Sea}/{East Blue}).
 *
 * Card text: "[Main] You may rest 3 of your cards: K.O. up to 1 of your opponent's rested Characters
 * with 7000 base power or less.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to" allows 0), CR 4-9-2 (base power),
 * CR 7-1-5-3 (battle durations), RD 93 (Event [Counter]).
 */
import { describe, expect, it } from 'vitest';
import type { CardPlacement } from '@optcg/engine';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  C14,
  canFinish,
  choose,
  don,
  hand,
  inst,
  L14,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  put,
  reachablePickSets,
  rested,
  settle,
  theirs,
  trash,
  useCounter,
} from './kit-op14b.ts';

const EVT = 'OP14-037';
const R = (card: string): CardPlacement => ({ card, rested: true });

function start(p2chars: (string | CardPlacement)[], active = 10, p1chars: string[] = []) {
  return mine(
    L14.luffy,
    { hand: [EVT], characters: p1chars, costArea: { active, rested: 0 } },
    { characters: p2chars },
  );
}
/** Play the Event, accept, rest 3 DON!! and pick `target`. */
function fire(g: ReturnType<typeof start>, target: string | null) {
  put(g, EVT);
  answerMay(g, true);
  settle(g, { cost: 'don', target: target === null ? null : inst(g, 'p2', 'characters', target) });
}

describe('OP14-037 For Fun: [Main] rest 3 cards: K.O. a rested Character (7000 base or less); [Counter] Leader +3000', () => {
  it('[Main] K.O.s a rested 7000-base Character and rests 3 DON!! on top of the Event cost', () => {
    const g = start([R(C14.kingdew)]);
    fire(g, C14.kingdew);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([C14.kingdew]);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('boundary: a rested 8000-base Character is not offered, a rested 7000-base one is', () => {
    const g = start([R(C14.kingdew), R(C14.thatch)]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew]);
  });

  it('only rested Characters can be chosen: an active 5000-base Character is not offered', () => {
    const g = start([R(C14.marco), C14.sai]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.marco]);
  });

  it('the cost can be paid by the Leader, a Character and a DON!! card together', () => {
    const g = start([R(C14.kingdew)], 10, [C14.marco]);
    put(g, EVT);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.leader('p1') });
    act(g, { type: 'pick', choice: inst(g, 'p1', 'characters', C14.marco) });
    act(g, { type: 'pick', choice: { from: 'costActive' } });
    settle(g, { target: inst(g, 'p2', 'characters', C14.kingdew) });
    expect(rested(g, g.leader('p1'))).toBe(true);
    expect(rested(g, inst(g, 'p1', 'characters', C14.marco))).toBe(true);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(g.zone('p2', 'characters')).toEqual([]);
  });

  it('exactly 3 restable cards after paying the Event cost is enough', () => {
    const g = mine(
      L14.luffy,
      { hand: [EVT], costArea: { active: 4, rested: 0 } },
      { characters: [R(C14.kingdew)] },
    );
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don', target: inst(g, 'p2', 'characters', C14.kingdew) });
    expect(g.zone('p2', 'characters')).toEqual([]);
  });

  it("the cost is all or nothing: with only 2 restable cards left nothing is rested and nothing is K.O.'d", () => {
    const g = mine(
      { card: L14.luffy, rested: true },
      { hand: [EVT], costArea: { active: 3, rested: 0 } },
      { characters: [R(C14.kingdew)] },
    );
    put(g, EVT);
    mustBeUnpayable(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.kingdew]);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it('declining the optional cost rests nothing and K.O.s nothing; the Event is still spent', () => {
    const g = start([R(C14.kingdew)]);
    put(g, EVT);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.kingdew]);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": the target may be left empty after the cost is paid, and nothing is K.O.\'d', () => {
    const g = start([R(C14.kingdew)]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.kingdew]);
  });

  it("at most one Character is K.O.'d even when two qualify", () => {
    const g = start([R(C14.kingdew), R(C14.marco)]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('must not K.O. your own rested Characters (they are not offered)', () => {
    const g = start([R(C14.kingdew)], 10, [C14.sai]);
    put(g, EVT);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    // cost candidates include the own Character; pay with DON!! only
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew]);
  });

  it('[Counter]: the Leader gains +3000 during this battle (8000 holds off a 5000 attack) and it ends with the battle', () => {
    const g = theirs(L14.luffy, { hand: [EVT], costArea: { active: 1, rested: 0 } }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    void choose;
  });
});
