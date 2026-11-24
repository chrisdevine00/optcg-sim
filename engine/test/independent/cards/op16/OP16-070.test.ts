/**
 * OP16-070 Donquixote Rosinante (Character, Purple, cost 2, 1000, Counter +1000, {Donquixote Pirates}/{Navy}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may rest 2 of your DON!! cards: If your Leader has the {Navy} type,
 * add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: CR 10-1-4 ([Blocker]), RD 112 (optional cost on [On Play]), CR 8-3-1-3 (cost all or nothing),
 * CR 8-3-3 (text after a failed "if" does not resolve; the cost is already paid), CR 8-4-4-1 ("up to").
 * E-Q11: "add up to N DON!!" asks a count.
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers } from '../../helpers.ts';
import {
  answerMay,
  backAtMain,
  donCountOptions,
  don,
  inst,
  kind,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  payDon,
  put,
  SCN,
  takeDon,
  theirs,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ROSI = 'OP16-070';

/** 8 DON!! in the cost area (the DON!! deck holds 2), playing Rosinante (cost 2). */
function played(leader: string, active = 8): TestGame {
  const g = mine(leader, { hand: [ROSI], costArea: { active, rested: 0 } });
  put(g, ROSI);
  return g;
}

describe('OP16-070 Donquixote Rosinante: [Blocker]; [On Play] rest 2 DON!!: if your Leader is {Navy}, add up to 1 rested DON!!', () => {
  it('has [Blocker] and blocks', () => {
    const g = theirs(LDR.navy, { characters: [ROSI] }, { characters: [SCN.c3] });
    expect(g.card(inst(g, 'p1', 'characters', ROSI)).keywords).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', ROSI)]);
  });

  it('Navy Leader: rest 2 DON!!, then 1 DON!! is added from the DON!! deck RESTED', () => {
    const g = played(LDR.navy);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    need(g, 'choose', 'p1');
    takeDon(g, 1);
    // 8 active: 2 rested to play Rosinante, 2 rested for the cost, then 1 added rested.
    expect(don(g)).toMatchObject({ active: 4, rested: 5, deck: 1 });
    expect(backAtMain(g)).toBe(true);
  });

  it('"up to 1": the count may be 1 or 0; 0 adds nothing but the cost stays paid', () => {
    const g = played(LDR.navy);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ active: 4, rested: 4, deck: 2 });
  });

  it('a Leader with {Navy} among several types ({Donquixote Pirates}/{Navy}) counts', () => {
    const g = played(LDR.dpNavy);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    takeDon(g, 1);
    expect(don(g).deck).toBe(1);
  });

  it('CR 8-3-3: a Leader that is not {Navy}: the cost may still be paid, but no DON!! is added', () => {
    const g = played(LDR.dp);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 4, rested: 4, deck: 2 });
  });

  it('declining the optional cost: no DON!! is rested and none is added', () => {
    const g = played(LDR.navy);
    answerMay(g, false);
    expect(don(g)).toMatchObject({ active: 6, rested: 2, deck: 2 });
    expect(backAtMain(g)).toBe(true);
  });

  it('cost boundary: with only 1 active DON!! left after playing it, the cost of 2 cannot be paid', () => {
    const g = played(LDR.navy, 3);
    mustBeUnpayable(g);
    expect(don(g)).toMatchObject({ active: 1, rested: 2, deck: 7 });
  });

  it('exactly 2 active DON!! left is enough', () => {
    const g = played(LDR.navy, 4);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 0, rested: 5, deck: 5 });
  });

  it('with an empty DON!! deck nothing can be added', () => {
    const g = played(LDR.navy, 10);
    answerMay(g, true);
    payDon(g, 2, 'costActive');
    expect(don(g)).toMatchObject({ rested: 4, deck: 0 });
  });
});
