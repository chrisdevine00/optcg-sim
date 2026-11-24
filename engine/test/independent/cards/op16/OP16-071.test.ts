/**
 * OP16-071 Benevolent King of the Waves (Character, Purple, cost 3, 5000, no Counter, {Navy}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Add up to 1 DON!! card from your DON!! deck
 * and rest it. [On K.O.] Add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: RD 112 (optional cost on [On Play]), CR 8-3-1-3, CR 10-2-17 / RD 110 ([On K.O.] only when
 * K.O.'d, by battle or by an effect; other removal is no K.O.), CR 8-4-4-1 ("up to"), CR 10-2-14.
 * E-Q11: "add up to N DON!!" asks a count.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  answerMay,
  asksDonCount,
  backAtMain,
  BLUE,
  donCountOptions,
  don,
  fill,
  hand,
  inst,
  kind,
  LDR,
  mine,
  mustBeUnpayable,
  need,
  payCost,
  pickInst,
  put,
  SCN,
  SCN2,
  takeDon,
  theirs,
  trash,
  opponentKOs,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const KING = 'OP16-071';

function played(handCards: string[]): TestGame {
  const g = mine(LDR.navy, { hand: [KING, ...handCards], costArea: { active: 6, rested: 0 } });
  put(g, KING);
  return g;
}
/** My rested King is attacked by p2's 5000-power Character (K.O.'d unless countered). */
function attacked(): TestGame {
  const g = theirs(
    LDR.navy,
    { characters: [{ card: KING, rested: true }], costArea: { active: 6, rested: 0 } },
    { characters: [SCN.c3] },
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c3), inst(g, 'p1', 'characters', KING));
  passBlock(g);
  return g;
}

describe('OP16-071 Benevolent King of the Waves: [On Play] trash 1: add up to 1 rested DON!!; [On K.O.] add up to 1 rested DON!!', () => {
  it('[On Play]: trash 1 card from hand, then 1 DON!! is added from the DON!! deck RESTED', () => {
    const g = played([SCN.c1, SCN.c2]);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    payCost(g, inst(g, 'p1', 'hand', SCN.c1));
    takeDon(g, 1);
    expect(trash(g)).toEqual([SCN.c1]);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(don(g)).toMatchObject({ active: 3, rested: 4, deck: 3 });
    expect(backAtMain(g)).toBe(true);
  });

  it('"up to 1": the count may be 1 or 0; 0 leaves the trashed card trashed and adds nothing', () => {
    const g = played([SCN.c1]);
    answerMay(g, true);
    payCost(g);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 0);
    expect(trash(g)).toEqual([SCN.c1]);
    expect(don(g)).toMatchObject({ rested: 3, deck: 4 });
  });

  it('declining the optional cost: no card is trashed and no DON!! is added', () => {
    const g = played([SCN.c1]);
    answerMay(g, false);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(trash(g)).toEqual([]);
    expect(don(g)).toMatchObject({ rested: 3, deck: 4 });
  });

  it('with an empty hand the cost cannot be paid and nothing is added', () => {
    const g = played([]);
    mustBeUnpayable(g);
    expect(don(g)).toMatchObject({ rested: 3, deck: 4 });
    expect(kind(g)).toBe('main');
  });

  it('exactly 1 card is trashed as the cost even with a larger hand', () => {
    const g = played([SCN.c1, SCN.c2, SCN.c3]);
    answerMay(g, true);
    payCost(g, inst(g, 'p1', 'hand', SCN.c2));
    takeDon(g, 1);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([SCN.c1, SCN.c3].sort());
  });

  it('[On K.O.]: K.O.’d in battle: adds up to 1 rested DON!! (no cost, no condition)', () => {
    const g = attacked();
    passCounter(g);
    // Not blocked, no counter: the Damage Step K.O.s it; [On K.O.] asks the count.
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ active: 6, rested: 1, deck: 3 });
    expect(trash(g)).toContain(KING);
  });

  it('[On K.O.] "up to 1": may add 0', () => {
    const g = attacked();
    passCounter(g);
    expect(donCountOptions(g).sort()).toEqual(['0', '1']);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ rested: 0, deck: 4 });
  });

  it('[On K.O.] also works for a K.O. by an opposing effect (Gum-Gum Lightning on a 5000 Character)', () => {
    const g = theirs(
      LDR.navy,
      { characters: [KING] },
      { hand: [SCN2.lightning], costArea: { active: 10, rested: 0 }, deck: fill(BLUE, 10) },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', KING));
    need(g, 'choose', 'p1');
    takeDon(g, 1);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('must-not-happen: the [On K.O.] is not the [On Play]: a King that is merely on the field when the opponent attacks a different card adds nothing', () => {
    const g = theirs(
      LDR.navy,
      { characters: [{ card: KING, rested: true }], costArea: { active: 6, rested: 0 } },
      { characters: [SCN.c3] },
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(don(g)).toMatchObject({ rested: 0, deck: 4 });
    void pickInst;
  });

  it('RD 78: trashed by the Character limit (a 6th Character played) it is not a K.O.: no [On K.O.]', () => {
    const g = mine(LDR.navy, {
      hand: [SCN.c2],
      characters: [KING, SCN.c3, SCN.c4, SCN.c5, SCN.c6],
      costArea: { active: 6, rested: 0 },
    });
    put(g, SCN.c2);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', KING)]);
    expect(trash(g)).toContain(KING);
    expect(asksDonCount(g)).toBe(false);
    expect(don(g)).toMatchObject({ rested: 2, deck: 4 });
  });
});
