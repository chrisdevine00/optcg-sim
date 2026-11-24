/**
 * OP16-076 The Three Admirals!! (Event, Purple, cost 1, {Navy}/{Admiral}).
 *
 * Card text: "[Main] You may rest 3 of your DON!! cards: Up to 3 of your {Admiral} type Characters gain
 * +2000 power during this turn. [Counter] If you have an {Admiral} type Character, up to 1 of your
 * Leader or Character cards gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost), CR 8-4-4-1 ("up to"), CR 2-4-3 ({Type} is exact), CR 6-6-1-3 ("during this
 * turn"), CR 3-1-2-1 ("you have" is the field), CR 7-1-5-3 (battle duration), CR 8-3-3 (failed "if").
 *
 * Scenery: {Admiral} Characters OP16-063 Kuzan, OP16-065 Sakazuki, OP16-073 Borsalino, OP17-059 Aramaki
 * (cost 7, 8000); only their stats matter while they stand on the field.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  answerMay,
  at,
  backAtMain,
  canCounterWith,
  chooseIfAsked,
  choices,
  declineChoice,
  don,
  inst,
  kind,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  payDon,
  pickInst,
  put,
  SCN,
  theirs,
  toMyNextMain,
  useCounter,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVT = 'OP16-076';
const KUZAN = 'OP16-063';
const SAKAZUKI = 'OP16-065';
const BORSA = 'OP16-073';
const ARAMAKI = 'OP17-059';
/** OP16-066 Sengoku: {Navy} but not {Admiral}, 5000. */
const NAVY_ONLY = 'OP16-066';

function main(chars: string[], active = 10): TestGame {
  const g = mine(LDR.navy, { hand: [EVT], characters: chars, costArea: { active, rested: 0 } });
  put(g, EVT);
  return g;
}
function fire(chars: string[]): TestGame {
  const g = main(chars);
  answerMay(g, true);
  payDon(g, 3, 'costActive');
  need(g, 'choose', 'p1');
  return g;
}
const pw = (g: TestGame, card: string) => g.power(at(g, 'p1', 'characters', card));

describe('OP16-076 The Three Admirals!!: [Main] rest 3 DON!!: up to 3 {Admiral} Characters +2000 this turn; [Counter] with an {Admiral}, +4000 during this battle', () => {
  it('[Main]: 3 {Admiral} Characters each gain +2000 (8000 -> 10000), the cost is 3 rested DON!! plus 1 for the Event', () => {
    const g = fire([KUZAN, SAKAZUKI, BORSA]);
    pickInst(
      g,
      [KUZAN, SAKAZUKI, BORSA].map((c) => at(g, 'p1', 'characters', c)),
    );
    expect(backAtMain(g)).toBe(true);
    for (const c of [KUZAN, SAKAZUKI, BORSA]) expect(pw(g, c)).toBe(10000);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('"up to 3": with 4 {Admiral} Characters on the field at most 3 can be chosen', () => {
    const g = fire([KUZAN, SAKAZUKI, BORSA, ARAMAKI]);
    expect(choices(g)).toHaveLength(4);
    pickInst(
      g,
      [KUZAN, SAKAZUKI, BORSA].map((c) => at(g, 'p1', 'characters', c)),
    );
    expect(kind(g)).toBe('main');
    expect(pw(g, ARAMAKI)).toBe(8000);
  });

  it('"up to 3": choosing just 1, or none, is allowed', () => {
    const one = fire([KUZAN, SAKAZUKI]);
    pickInst(one, [at(one, 'p1', 'characters', SAKAZUKI)]);
    expect(pw(one, SAKAZUKI)).toBe(10000);
    expect(pw(one, KUZAN)).toBe(8000);
    const zero = fire([KUZAN]);
    declineChoice(zero);
    expect(pw(zero, KUZAN)).toBe(8000);
  });

  it('only {Admiral} Characters are offered: a {Navy} Character that is not {Admiral}, and the Leader, are not', () => {
    const g = fire([KUZAN, NAVY_ONLY, SCN.c3]);
    expect(offeredNow(g)).toEqual([KUZAN]);
  });

  it('cost boundary: after the Event’s own cost, 3 active DON!! are enough, 2 are not', () => {
    const ok = main([KUZAN], 4);
    answerMay(ok, true);
    payDon(ok, 3, 'costActive');
    expect(kind(ok)).toBe('choose');
    const no = main([KUZAN], 3);
    mustBeUnpayable(no);
    expect(pw(no, KUZAN)).toBe(8000);
    expect(don(no)).toMatchObject({ active: 2, rested: 1 });
  });

  it('declining the optional cost: no DON!! is rested and no power is given', () => {
    const g = main([KUZAN]);
    answerMay(g, false);
    expect(pw(g, KUZAN)).toBe(8000);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('"during this turn": the +2000 is gone on my next turn', () => {
    const g = fire([KUZAN]);
    pickInst(g, [at(g, 'p1', 'characters', KUZAN)]);
    toMyNextMain(g);
    expect(pw(g, KUZAN)).toBe(8000);
  });

  function defend(own: string[], hand: string[] = [EVT]): TestGame {
    const g = theirs(
      LDR.navy,
      { characters: own, hand, costArea: { active: 1, rested: 0 } },
      { characters: [] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('[Counter] with an {Admiral} Character: my Leader gains +4000 (9000), the 5000 attack fails, and it ends with the battle', () => {
    const g = defend([KUZAN]);
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] without an {Admiral} Character (a {Navy} non-Admiral only, or one in hand): no boost', () => {
    const g = defend([NAVY_ONLY], [EVT, KUZAN]);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) {
      useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
      chooseIfAsked(g, [g.leader('p1')]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] "up to 1": the boost may go to a Character, and then only that card gets it', () => {
    const g = defend([KUZAN]);
    useCounter(g, inst(g, 'p1', 'hand', EVT), at(g, 'p1', 'characters', KUZAN));
    chooseIfAsked(g, [at(g, 'p1', 'characters', KUZAN)]);
    expect(pw(g, KUZAN)).toBe(12000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
