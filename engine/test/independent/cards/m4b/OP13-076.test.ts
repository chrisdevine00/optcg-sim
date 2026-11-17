/**
 * OP13-076 Divine Departure (Event, Purple, cost 0, {Roger Pirates}/{King of the Pirates}).
 *
 * Card text:
 *   "[Main] You may rest 5 of your DON!! cards: If you have any DON!! cards given, give up to 1
 *    of your opponent's Characters −8000 power during this turn.
 *    [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards
 *    gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-5 / QA-GR (rest N DON!! = N active cost-area DON!!, given DON!! are not in the
 * cost area); CR 8-3-1-3 (cost must be fully payable); CR 8-3-1-4 (skipped "may" → no effect);
 * CR 4-10-1 (a failed "if" ends the effect, but the cost is already paid); CR 2-7-3 (Event
 * trashed first); CR 7-1-3-1-2 (Event [Counter]); CR 7-1-4 (attacker wins ties).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import { canCounterWith, donOf, kind, myTurn, theirTurn, useCounter } from '../kit.ts';
import {
  C,
  drive,
  leaderDon,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP13-076';

function mainGame(p1: Parameters<typeof side>[2] = {}) {
  return myTurn(
    leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 5, rested: 0 }, ...p1 }), 1),
    side(C.luffy, FILLER, { characters: [V.littleOars, V.sunny] }),
  );
}

describe('OP13-076 Divine Departure: [Main] rest 5 DON!! → −8000 if you have DON!! given', () => {
  it('happy path (DON!! given to the Leader): rests 5 and the chosen Character gets −8000', () => {
    const g = mainGame();
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(1000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5, given: 1 });
  });

  it('DON!! given to a Character also counts as "any DON!! cards given"', () => {
    const g = myTurn(
      side(C.shanks, FILLER, {
        hand: [ID],
        costArea: { active: 5, rested: 0 },
        characters: [{ card: V.sai, don: 1 }],
      }),
      side(C.luffy, FILLER, { characters: [V.littleOars] }),
    );
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(1000);
  });

  it('CR 4-10-1: with no DON!! given the 5 DON!! are still rested (if accepted) but nobody gets −8000', () => {
    const g = myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 5, rested: 0 } }),
      side(C.luffy, FILLER, { characters: [V.littleOars] }),
    );
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(9000);
  });

  it('only opponent Characters are targets (not their Leader, not mine)', () => {
    const g = mainGame({ characters: [V.sai] });
    playCard(g, 'p1', ID);
    for (let i = 0; i < 4 && kind(g) === 'optional'; i++)
      act(g, { type: 'optional', accept: true });
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.littleOars, V.sunny]));
  });

  it('"up to 1": may choose no target', () => {
    const g = mainGame();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(g.power(g.find('p2', 'characters', V.littleOars))).toBe(9000);
  });

  it('CR 8-3-1-3: with only 4 active DON!! the cost cannot be paid: no DON!! is rested and no −8000', () => {
    const g = mainGame({ costArea: { active: 4, rested: 0 } });
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(9000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('CR 8-3-1-5: DON!! given to the Leader is not a cost-area DON!! and cannot pay the "rest 5"', () => {
    const g = myTurn(
      leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }), 2),
      side(C.luffy, FILLER, { characters: [V.littleOars] }),
    );
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(9000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 2 });
  });

  it('CR 8-3-1-4: declining the "may" cost rests nothing and gives no −8000; the Event is still spent', () => {
    const g = mainGame();
    const t = g.find('p2', 'characters', V.littleOars);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [t] });
    expect(g.power(t)).toBe(9000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });
});

describe('OP13-076 Divine Departure: [Counter] trash 1 → Leader or Character +3000 during this battle', () => {
  function defending(hand: string[]) {
    return theirTurn(
      side(C.shanks, FILLER, { hand: [ID, ...hand], characters: [V.sai] }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
  }

  it('happy path: trash 1, Leader 5000 + 3000 = 8000 beats a 7000 attacker; the boost ends with the battle', () => {
    const g = defending([V.marco]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1'), g.find('p1', 'hand', V.marco)] });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([ID, V.marco].sort());
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('may be given to a Character instead of the Leader', () => {
    const g = defending([V.marco]);
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [sai, g.find('p1', 'hand', V.marco)] });
    expect(g.power(sai)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with no other card in hand the Counter cost cannot be paid, so there is no boost', () => {
    const g = defending([]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    if (canCounterWith(g, g.find('p1', 'hand', ID))) {
      useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
      drive(g, 'p1', { targets: [g.leader('p1')] });
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-4: declining the trash gives no boost', () => {
    const g = defending([V.marco]);
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    const card = g.find('p1', 'hand', ID);
    expect(canCounterWith(g, card)).toBe(true);
    g.act(
      g.legal().find((a) => (a.type === 'activate' || a.type === 'counter') && a.card === card)!,
    );
    drive(g, 'p1', { accept: false, targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(ids(g, 'p1', 'hand')).toContain(V.marco);
  });
});
