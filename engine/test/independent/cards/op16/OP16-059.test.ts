/**
 * OP16-059 We'll Change This Mission from Sneaky to Flashy! (Event, Blue, cost 1, {Buggy Pirates}/{Impel Down}).
 *
 * Card text: "[Main] You may rest 7 of your DON!! cards: Look at 5 cards from the top of your deck; play
 * up to 2 {Impel Down} type Character cards with 6000 power or less. Then, place the rest at the
 * bottom of your deck in any order. [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 11-3 (looking at the deck), CR 8-4-4-1 ("up to"), CR 8-4-4-2, CR 3-7-6 (Character limit),
 * CR 8-3-1 (the 7-DON!! cost), CR 3-1-7 (order), CR 7-1-5-3 (battle duration), RD 93 (Event [Counter]).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  answerMay,
  backAtMain,
  BLUE,
  canFinish,
  choices,
  deck,
  declineChoice,
  don,
  fill,
  hand,
  ID,
  inst,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  payDon,
  pickCards,
  pickInst,
  put,
  SCN,
  settleOrders,
  tail,
  theirs,
  useCounter,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVT = 'OP16-059';
/** Top 5: Sphinx 6000 (yes), Army Wolves 7000 (no), Mr.2 Bentham 6000 (yes), a 5000 non-{Impel Down} (no), Blugori 3000 (yes). */
const TOP5: string[] = [ID.sphinx, ID.wolves, ID.bentham, SCN.c3, ID.blugori];
/** The 6th card is a qualifying Character: it must not be offered. */
const BEYOND = [ID.blugori, ...fill(BLUE, 8)];

function start(top5 = TOP5, active = 10, chars: string[] = []): TestGame {
  const g = mine(LDR.impel, {
    hand: [EVT],
    deck: [...top5, ...BEYOND],
    characters: chars,
    costArea: { active, rested: 0 },
  });
  put(g, EVT);
  answerMay(g, true);
  payDon(g, 7, 'costActive');
  return g;
}
const onField = (g: TestGame) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe("OP16-059 We'll Change This Mission from Sneaky to Flashy!: [Main] rest 7 DON!!: look at 5, play up to 2 {Impel Down} Characters with 6000 power or less, rest to the bottom", () => {
  it('offers exactly the {Impel Down} Characters with 6000 power or less among the top 5', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([ID.sphinx, ID.bentham, ID.blugori].sort());
  });

  it('boundary: 6000 is enough, 7000 is not (Army Wolves is never offered); a non-{Impel Down} 5000 is not offered', () => {
    const g = start();
    const o = offeredNow(g);
    expect(o).toContain(ID.sphinx);
    expect(o).not.toContain(ID.wolves);
    expect(o).not.toContain(SCN.c3);
  });

  it('playing 2: both enter the field without paying their cost, the other 3 go to the bottom', () => {
    const g = start();
    pickCards(g, [ID.sphinx, ID.blugori]);
    settleOrders(g);
    expect(backAtMain(g)).toBe(true);
    expect(onField(g)).toEqual([ID.sphinx, ID.blugori].sort());
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(ID.blugori);
    expect(tail(deck(g), 3)).toEqual([ID.wolves, ID.bentham, SCN.c3].sort());
    expect(don(g)).toMatchObject({ active: 2, rested: 8 });
  });

  it('"up to 2": playing just 1 is allowed; the unplayed qualifying cards also go to the bottom', () => {
    const g = start();
    pickCards(g, [ID.bentham]);
    settleOrders(g);
    expect(onField(g)).toEqual([ID.bentham]);
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 4)).toEqual([ID.sphinx, ID.wolves, SCN.c3, ID.blugori].sort());
  });

  it('"up to 2": playing none is allowed; all 5 cards go to the bottom', () => {
    const g = start();
    need(g, 'choose', 'p1');
    declineChoice(g);
    settleOrders(g);
    expect(onField(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(ID.blugori);
    expect(tail(deck(g), 5)).toEqual([...TOP5].sort());
  });

  it('at most 2 are played: after 2 picks no third pick is offered', () => {
    const g = start();
    need(g, 'choose', 'p1');
    const first = choices(g)[0]!;
    act(g, { type: 'pick', choice: first });
    const second = choices(g)[0];
    expect(second).toBeDefined();
    act(g, { type: 'pick', choice: second! });
    // A third pick is not available: the decision has moved on or offers nothing.
    expect(canFinish(g) ? choices(g).length : 0).toBe(0);
  });

  it('only the top 5 are looked at: with no qualifying card among them nothing is offered', () => {
    const g = start([ID.wolves, SCN.c3, SCN.c4, SCN.c5, SCN.c6]);
    if (g.legal().some((a) => a.type === 'pick')) throw new Error('nothing should be offered');
    if (canFinish(g)) declineChoice(g);
    settleOrders(g);
    expect(onField(g)).toEqual([]);
    expect(deck(g)[0]).toBe(ID.blugori);
  });

  it('the cost is exactly 7 rested DON!!: after the Event cost of 1, 6 active DON!! cannot pay it', () => {
    const g = mine(LDR.impel, {
      hand: [EVT],
      deck: [...TOP5, ...BEYOND],
      costArea: { active: 7, rested: 0 },
    });
    put(g, EVT);
    mustBeUnpayable(g);
    expect(deck(g)).toHaveLength(14);
    expect(onField(g)).toEqual([]);
  });

  it('declining the optional cost: the deck is not touched and nothing is played', () => {
    const g = mine(LDR.impel, { hand: [EVT], deck: [...TOP5, ...BEYOND] });
    put(g, EVT);
    answerMay(g, false);
    expect(backAtMain(g)).toBe(true);
    expect(deck(g).slice(0, 5)).toEqual(TOP5);
    expect(hand(g)).toEqual([]);
  });

  it('[Counter]: my Leader gains +3000 during this battle', () => {
    const g = theirs(LDR.luffy, { hand: [EVT], costArea: { active: 1, rested: 0 } }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('Character limit (CR 3-7-6): with 4 Characters in play, playing 2 means trashing one of my Characters to make room', () => {
    const g = start(TOP5, 10, [SCN.c1, SCN.c2, SCN.c4, SCN.c5]);
    pickCards(g, [ID.sphinx, ID.bentham]);
    need(g, 'choose', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c1)]);
    settleOrders(g);
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(SCN.c1);
  });
});
