/**
 * OP14-038 I Never Bother to Remember the Faces of Trash (Event, Green, cost 1, {The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] You may rest 2 of your cards: Draw 1 card and rest up to 1 of your opponent's
 * Characters with 7000 base power or less.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost all or nothing), CR 4-8-1 ("up to" allows 0), CR 4-9-2 (base power),
 * CR 7-1-5-3 (battle durations).
 */
import { describe, expect, it } from 'vitest';
import type { CardPlacement } from '@optcg/engine';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  BLUE,
  C14,
  canFinish,
  choices,
  deck,
  don,
  hand,
  inst,
  kind,
  L14,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  put,
  rested,
  settle,
  theirs,
  useCounter,
} from './kit-op14b.ts';

const EVT = 'OP14-038';
const R = (card: string): CardPlacement => ({ card, rested: true });

function start(p2chars: (string | CardPlacement)[], active = 10) {
  return mine(
    L14.luffy,
    {
      hand: [EVT, C14.sai],
      deck: [C14.kingdew, C14.thatch, BLUE, BLUE, BLUE],
      costArea: { active, rested: 0 },
    },
    { characters: p2chars },
  );
}
function fire(g: ReturnType<typeof start>, target: string | null) {
  put(g, EVT);
  answerMay(g, true);
  settle(g, { cost: 'don', target: target === null ? null : inst(g, 'p2', 'characters', target) });
}

describe('OP14-038 I Never Bother to Remember the Faces of Trash: [Main] rest 2 cards: draw 1 and rest a Character; [Counter] Leader +3000', () => {
  it('[Main] draws the top card and rests an ACTIVE opposing 7000-base Character; two DON!! are rested for the cost', () => {
    const g = start([C14.kingdew]);
    fire(g, C14.kingdew);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(true);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('boundary: a Character with 8000 base power is not offered, one with 7000 is', () => {
    const g = start([C14.kingdew, C14.thatch]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew]);
  });

  it('an already rested Character may be chosen (resting it changes nothing) and the card is still drawn', () => {
    const g = start([R(C14.marco)]);
    fire(g, C14.marco);
    expect(rested(g, inst(g, 'p2', 'characters', C14.marco))).toBe(true);
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
  });

  it('"up to 1": choosing no target still draws the card', () => {
    const g = start([C14.kingdew]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('with only an 8000-base Character on the other side the card is still drawn and nothing is rested', () => {
    const g = start([C14.thatch]);
    put(g, EVT);
    answerMay(g, true);
    settle(g, { cost: 'don' });
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.thatch))).toBe(false);
  });

  it('declining the optional cost: no draw, nothing rested, the Event is spent', () => {
    const g = start([C14.kingdew]);
    put(g, EVT);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai]);
    expect(deck(g)[0]).toBe(C14.kingdew);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('the cost is exactly 2 cards: with one restable card left it cannot be paid and nothing happens', () => {
    const g = mine(
      { card: L14.luffy, rested: true },
      { hand: [EVT, C14.sai], deck: [C14.kingdew, BLUE, BLUE], costArea: { active: 2, rested: 0 } },
      { characters: [C14.kingdew] },
    );
    put(g, EVT);
    mustBeUnpayable(g);
    expect(hand(g)).toEqual([C14.sai]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('exactly 2 restable cards are enough', () => {
    const g = mine(
      { card: L14.luffy, rested: true },
      { hand: [EVT, C14.sai], deck: [C14.kingdew, BLUE, BLUE], costArea: { active: 3, rested: 0 } },
      { characters: [C14.kingdew] },
    );
    fire(g, C14.kingdew);
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(true);
  });

  it('must not rest your own Characters with the effect, and only one opposing Character is rested', () => {
    const g = mine(
      L14.luffy,
      {
        hand: [EVT],
        characters: [C14.sai],
        deck: [BLUE, BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      { characters: [C14.marco, C14.kingdew] },
    );
    put(g, EVT);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    // pay with DON!! so the own Character stays active
    settle(g, { cost: 'don' });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew, C14.marco].sort());
    act(g, { type: 'pick', choice: inst(g, 'p2', 'characters', C14.marco) });
    expect(rested(g, inst(g, 'p1', 'characters', C14.sai))).toBe(false);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
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
    expect(hand(g)).toEqual([]);
  });
});
