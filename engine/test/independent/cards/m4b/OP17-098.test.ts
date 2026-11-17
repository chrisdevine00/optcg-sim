/**
 * OP17-098 Gum-Gum Kong Gun (Event, Black, cost 1, {Elbaph}/{The Four Emperors}/{Straw Hat Crew}).
 *
 * Card text:
 *   "[Main] You may rest 6 of your DON!! cards: If there is a Character with a cost of 12 or
 *    more, K.O. up to 2 of your opponent's Characters with a cost of 6 or less.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 2-7-3 (cost 1 first), CR 8-3-1-3 / 8-3-1-4 (the "rest 6" must be fully payable, "may"
 * skips the effect); CR 4-10-1 (failed "if" after the cost: cost stays paid, nothing K.O.'d);
 * CR 8-4-4-1 ("up to 2"); RL-43 (current cost, either player's Character counts).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import { donOf, eventCounterTargets, kind, myTurn, theirTurn, useCounter } from '../kit.ts';
import { C, drive, FILLER, ids, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-098';

function game(opts: { mine?: string[]; theirs?: string[]; active?: number } = {}) {
  return myTurn(
    side(C.elbaphLeader, FILLER, {
      hand: [ID],
      characters: opts.mine ?? [C.saul],
      costArea: { active: opts.active ?? 7, rested: 0 },
    }),
    side(C.shanks, FILLER, {
      characters: opts.theirs ?? [V.sunny, V.marco, V.thatch, V.littleOars],
    }),
  );
}

describe('OP17-098 Kong Gun: [Main] rest 6 DON!! → with a cost 12+ Character, K.O. up to 2 Characters (cost ≤6)', () => {
  it('happy path: pays 1 + rests 6 and K.O.s two Characters (cost 3 and cost 6)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p2', 'characters', V.marco), g.find('p2', 'characters', V.thatch)],
      don: 'costActive',
    });
    expect(sorted(ids(g, 'p2', 'trash'))).toEqual(sorted([V.marco, V.thatch]));
    expect(sorted(ids(g, 'p2', 'characters'))).toEqual(sorted([V.sunny, V.littleOars]));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });

  it('boundary: cost 6 can be chosen, cost 7 cannot; only opponent Characters are candidates', () => {
    const g = game();
    playCard(g, 'p1', ID);
    for (let i = 0; i < 3 && kind(g) === 'optional'; i++) g.act({ type: 'optional', accept: true });
    for (let i = 0; i < 8 && kind(g) === 'choose' && offeredCards(g).length === 0; i++) {
      g.act(g.legal().find((a) => a.type === 'pick')!);
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.sunny, V.marco, V.thatch]));
  });

  it('"up to 2": at most 2 are K.O.\'d even when 3 qualify', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [
        g.find('p2', 'characters', V.sunny),
        g.find('p2', 'characters', V.marco),
        g.find('p2', 'characters', V.thatch),
      ],
      don: 'costActive',
    });
    expect(ids(g, 'p2', 'trash')).toHaveLength(2);
  });

  it('"up to 2": may K.O. just 1, or none', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', V.marco)], don: 'costActive' });
    expect(ids(g, 'p2', 'trash')).toEqual([V.marco]);
    const h = game();
    playCard(h, 'p1', ID);
    drive(h, 'p1', { targets: [], don: 'costActive' });
    expect(ids(h, 'p2', 'trash')).toEqual([]);
  });

  it("the opponent's cost 12+ Character also satisfies the condition", () => {
    const g = game({ mine: [], theirs: [C.saul, V.marco] });
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', V.marco)], don: 'costActive' });
    expect(ids(g, 'p2', 'trash')).toEqual([V.marco]);
  });

  it("CR 4-10-1: with no cost 12+ Character the DON!! are rested but nobody is K.O.'d", () => {
    const g = game({ mine: [C.cost10] });
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', V.marco)], don: 'costActive' });
    expect(ids(g, 'p2', 'trash')).toEqual([]);
    expect(donOf(g, 'p1').rested).toBe(7);
  });

  it('CR 8-3-1-3: with only 6 active DON!! (1 spent on the Event) the cost cannot be paid: nothing happens', () => {
    const g = game({ active: 6 });
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p2', 'characters', V.marco)], don: 'costActive' });
    expect(ids(g, 'p2', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
  });

  it('CR 8-3-1-4: declining the "may" cost rests nothing more and K.O.s nobody', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [g.find('p2', 'characters', V.marco)] });
    expect(ids(g, 'p2', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 1 });
  });
});

describe('OP17-098 Kong Gun: [Counter] your Leader gains +3000 power during this battle', () => {
  function defending() {
    return theirTurn(
      side(C.elbaphLeader, FILLER, {
        hand: [ID],
        characters: [V.sai],
        costArea: { active: 1, rested: 0 },
      }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
  }

  it('Leader 5000 + 3000 stops a 7000 attacker; the boost ends with the battle', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it boosts the Leader only (no choice of a Character), even when a Character is attacked', () => {
    const g = theirTurn(
      side(C.elbaphLeader, FILLER, {
        hand: [ID],
        characters: [{ card: V.sai, rested: true }],
        costArea: { active: 1, rested: 0 },
      }),
      side(C.shanks, FILLER, { characters: [V.kingdew] }),
    );
    const sai = g.find('p1', 'characters', V.sai);
    attack(g, g.find('p2', 'characters', V.kingdew), sai);
    passBlock(g);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', ID));
    expect(targets.every((t) => t === g.leader('p1'))).toBe(true);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    drive(g, 'p1', {});
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(sai)).toBe(4000);
  });
});
