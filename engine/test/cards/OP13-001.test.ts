/** OP13-001 Monkey.D.Luffy (Leader). QA-OP13 OP13-001, RL-46. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, passBlock, pick, V } from './helpers.ts';
import { doneIf, p2AttackBoard, pickDon, RGL, SHC6, EAST_BLUE } from './helpers-rgl-penel.ts';

const board = (active: number, given = 1, chars: string[] = []) =>
  p2AttackBoard({
    leader: { card: RGL, don: given },
    characters: chars,
    costArea: { active, rested: 2 },
  });

describe('OP13-001 Monkey.D.Luffy', () => {
  it('rests chosen DON!! and gives this Leader +2000 per DON!! for the battle', () => {
    const g = board(3);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pickDon(g, 'active', 2);
    doneIf(g, 'DON!!');
    expect(don(g, 'p1').active).toBe(1);
    expect(don(g, 'p1').rested).toBe(4);
    pick(g, [g.leader('p1')]);
    // 5000 + 2 x 2000; the given DON!! adds nothing on the opponent's turn (CR 6-5-5-2).
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the boost can go to a {Straw Hat Crew} Character instead, and only to one', () => {
    const g = board(2, 1, [SHC6, EAST_BLUE]);
    accept(g);
    pickDon(g, 'active', 2);
    doneIf(g, 'DON!!');
    const d = expectDecision(g, 'choose', 'p1');
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2); // the Leader and the Straw Hat Crew Character, not the East Blue one
    expect(d.max).toBe(1);
    pick(g, [g.find('p1', 'characters', SHC6)]);
    expect(g.power(g.find('p1', 'characters', SHC6))).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost ends with the battle', () => {
    const g = board(1);
    accept(g);
    pickDon(g, 'active', 1);
    doneIf(g, 'DON!!');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    g.act({ type: 'endCounter' });
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('may be declined: nothing is rested', () => {
    const g = board(3);
    decline(g);
    expect(don(g, 'p1').active).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 6 or more active DON!! it is not offered', () => {
    const g = p2AttackBoard({
      leader: { card: RGL, don: 1 },
      costArea: { active: 6, rested: 0 },
    });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expectDecision(g, 'block', 'p1');
  });

  it('with exactly 5 active DON!! it is offered (the "5 or less" boundary)', () => {
    const g = board(5);
    expectDecision(g, 'optional', 'p1');
  });

  it('without a given DON!! ([DON!! x1]) it does not activate', () => {
    const g = board(3, 0);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expectDecision(g, 'block', 'p1');
  });

  it('RL-46 (QA-OP13): the active DON!! are counted at the attack, before any Counter', () => {
    // 6 active DON!! at the attack: the Leader is not offered, and no later Counter can change that.
    const g = p2AttackBoard({
      leader: { card: RGL, don: 1 },
      costArea: { active: 6, rested: 0 },
      hand: [V.c1],
    });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
  });
});
