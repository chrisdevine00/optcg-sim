/**
 * OP13-001 Monkey.D.Luffy (Leader, Green/Red, 5000, 4 Life; Straw Hat Crew / Supernovas).
 *
 * Card text (cards/data):
 *   "[DON!! x1] [On Your Opponent's Attack] If you have 5 or less active DON!! cards, you may rest
 *    any number of your DON!! cards. For every DON!! card rested this way, this Leader or up to 1 of
 *    your "Straw Hat Crew" type Characters gains +2000 power during this battle."
 *
 * Rules: [DON!! x1] needs 1 or more DON!! given to this Leader (a state check, CR 8-3-2-3, RL-13);
 * [On Your Opponent's Attack] activates in the Attack Step, before Block and Counter, whatever the
 * attack target is (CR 7-1-1-3, 10-2-16-1, RL-18, RL-34); the active-DON!! condition is counted when
 * it activates, before any Counter is used (QA-OP13 OP13-001, RL-46); resting is part of the effect,
 * and those DON!! cannot pay for a [Counter] Event afterwards (RL-46); "during this battle" ends
 * with the battle (CR 7-1-5-3). One recipient receives all the +2000s (RL-46: best answer).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  act,
  canCounter,
  CH,
  choiceCards,
  decision,
  decline,
  donChoices,
  donOf,
  drive,
  EV,
  F,
  kind,
  LB,
  myTurn,
  noDefence,
  offered,
  passBlock,
  pickMixed,
  side,
  sideL,
  takeDamage,
  theirTurn,
} from './kit-b.ts';

const LEADER = 'OP13-001';

function game(p1: Partial<PlayerSpec> = {}, leaderDon = 1, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    sideL({ card: LEADER, don: leaderDon }, F.green, {
      characters: [CH.robin, CH.marco],
      costArea: { active: 3, rested: 0 },
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew], ...p2 }),
  );
}

function attackLeader(g: ReturnType<typeof game>) {
  act(g, {
    type: 'attack',
    attacker: g.find('p2', 'characters', CH.kingdew),
    target: g.leader('p1'),
  });
}

describe('OP13-001 [DON!! x1] [On Your Opponent’s Attack]: rest any number of DON!!, +2000 each to the Leader or a Straw Hat Crew Character', () => {
  it('happy path: rest 2 DON!! → the Leader is 9000 and survives a 7000 attacker; 1 DON!! stays active', () => {
    const g = game();
    attackLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    drive(g, 'p1', { picks: [['DON', 'DON'], [g.leader('p1')]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('every DON!! rested is +2000: resting all 3 gives 11000', () => {
    const g = game();
    attackLeader(g);
    drive(g, 'p1', { picks: [['DON', 'DON', 'DON'], [g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(11000);
    expect(donOf(g, 'p1').active).toBe(0);
  });

  it('"any number" includes 0: no DON!! is rested and the Leader stays at 5000', () => {
    const g = game();
    attackLeader(g);
    drive(g, 'p1', { picks: [[], []] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('"you may": declining rests nothing', () => {
    const g = game();
    attackLeader(g);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1').active).toBe(3);
    expect(kind(g)).toBe('block');
  });

  it('the +2000s may go to a Straw Hat Crew Character instead: Robin 5000 → 9000, the Leader unchanged', () => {
    const g = game();
    attackLeader(g);
    const robin = g.find('p1', 'characters', CH.robin);
    drive(g, 'p1', { picks: [['DON', 'DON'], [robin]] });
    expect(g.power(robin)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('recipient candidates: the Leader and Straw Hat Crew Characters (Robin); not the non-SHC Marco', () => {
    const g = game();
    attackLeader(g);
    accept(g);
    pickMixed(g, ['DON'], 'costActive');
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([LEADER, CH.robin].sort());
  });

  it('the recipient is a single card: the boost is not split between the Leader and Robin', () => {
    const g = game();
    attackLeader(g);
    drive(g, 'p1', { picks: [['DON', 'DON'], [g.leader('p1')]] });
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });

  it('only active DON!! can be rested: the DON!! given to the Leader is not among the picks', () => {
    const g = game();
    attackLeader(g);
    accept(g);
    expect(donChoices(g).every((c) => c.from === 'costActive')).toBe(true);
    expect(donChoices(g).length).toBeGreaterThan(0);
  });

  it('"during this battle": the boost is gone after the battle', () => {
    const g = game();
    attackLeader(g);
    drive(g, 'p1', { picks: [['DON', 'DON'], [g.leader('p1')]] });
    noDefence(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('RL-18: it is decided in the Attack Step, before the Block Step: p1 owes the choice first, then the block decision', () => {
    const g = game();
    attackLeader(g);
    expect(decision(g)?.kind).toBe('optional');
    expect(decision(g)?.player).toBe('p1');
    decline(g);
    expect(decision(g)?.kind).toBe('block');
  });
});

describe('OP13-001: conditions', () => {
  it('exactly 5 active DON!! ("5 or less"): the effect is offered', () => {
    const g = game({ costArea: { active: 5, rested: 0 } });
    attackLeader(g);
    expect(offered(g, 'p1')).toBe(true);
  });

  it('6 active DON!!: the condition fails, the effect is not offered and the attack goes straight to the Block Step', () => {
    const g = game({ costArea: { active: 6, rested: 0 } });
    attackLeader(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('[DON!! x1]: with no DON!! given to the Leader the effect is not offered', () => {
    const g = game({}, 0);
    attackLeader(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('it activates whatever the attack target is: an attack on a rested Character still offers it', () => {
    const g = game({ characters: [{ card: CH.robin, rested: true }, CH.marco] });
    act(g, {
      type: 'attack',
      attacker: g.find('p2', 'characters', CH.kingdew),
      target: g.find('p1', 'characters', CH.robin),
    });
    expect(offered(g, 'p1')).toBe(true);
    drive(g, 'p1', { picks: [['DON', 'DON'], [g.find('p1', 'characters', CH.robin)]] });
    passBlock(g);
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(CH.robin);
  });

  it('only on the opponent’s attack: p1’s own attack does not offer it', () => {
    const g = myTurn(
      sideL({ card: LEADER, don: 1 }, F.green, { costArea: { active: 3, rested: 0 } }),
      side(LB.opp, F.red),
    );
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(offered(g, 'p1')).toBe(false);
  });

  it('RL-46: the DON!! rested by the effect cannot pay for a [Counter] Event afterwards', () => {
    const g = game({ hand: [EV.asura], costArea: { active: 1, rested: 0 } });
    attackLeader(g);
    drive(g, 'p1', { picks: [['DON'], [g.leader('p1')]] });
    passBlock(g);
    expect(kind(g)).toBe('counter');
    expect(canCounter(g, g.find('p1', 'hand', EV.asura))).toBe(false);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3); // 7000 vs 7000: the attacker wins the tie
  });

  it('RL-46: the condition is counted at the attack, so an active-DON!! count that would drop later does not matter', () => {
    const g = game({ costArea: { active: 5, rested: 0 } });
    attackLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    drive(g, 'p1', { picks: [['DON', 'DON', 'DON', 'DON', 'DON'], [g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(15000);
  });
});
