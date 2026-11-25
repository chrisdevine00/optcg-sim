/** ST26-005 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  passBlock,
  payDon,
  play,
  V,
} from './helpers.ts';
import { mk, OTHER_MULTI_LEADER, SHC_MONO_LEADER, SHC_MULTI_LEADER } from './helpers-st2627.ts';
import type { TestGame } from '../fixtures/index.ts';
import type { PlayerSpec } from '@optcg/engine';

const ID = 'ST26-005';
/** Luffy costs 6: 10 active DON!!, DON!! -2 returns 2 of the 4 left. */
const start = (
  leader: PlayerSpec['leader'] = SHC_MULTI_LEADER,
  oppDon = { active: 5, rested: 0 },
  active = 10,
): TestGame => mk({ leader, hand: [ID], costArea: { active, rested: 0 } }, { costArea: oppDon });
const leaderPower = (g: TestGame, who: 'p1' | 'p2' = 'p1') => g.power(g.leader(who));

describe('ST26-005 Monkey.D.Luffy', () => {
  it('[On Play] DON!! -2: with a multicolored {Straw Hat Crew} Leader and the opponent at 5 DON!!, the Leader base power becomes 7000', () => {
    const g = start();
    expect(leaderPower(g)).toBe(5000);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(2);
    expect(leaderPower(g)).toBe(7000);
    expectDecision(g, 'main', 'p1');
  });

  it('it is the BASE power: a DON!! given to the Leader still adds 1000', () => {
    const g = start({ card: SHC_MULTI_LEADER, don: 1 }, { active: 5, rested: 0 }, 9);
    expect(leaderPower(g)).toBe(6000);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(leaderPower(g)).toBe(8000);
  });

  it("lasts through the opponent's turn and ends after their End Phase", () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    g.act({ type: 'endTurn' });
    expect(leaderPower(g)).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(leaderPower(g)).toBe(5000);
  });

  it('the opponent DON!! count is the whole field and the threshold is inclusive at 5 (2 active + 3 rested)', () => {
    const g = start(SHC_MULTI_LEADER, { active: 2, rested: 3 });
    play(g, ID);
    accept(g);
    payDon(g);
    expect(leaderPower(g)).toBe(7000);
  });

  it('with 4 opposing DON!! the cost is paid and nothing else happens', () => {
    const g = start(SHC_MULTI_LEADER, { active: 3, rested: 1 });
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(2);
    expect(leaderPower(g)).toBe(5000);
    expectDecision(g, 'main', 'p1');
  });

  it('must not fire for a Leader that is not multicolored, nor for one without {Straw Hat Crew}', () => {
    const mono = start(SHC_MONO_LEADER);
    play(mono, ID);
    accept(mono);
    payDon(mono);
    expect(leaderPower(mono)).toBe(5000);
    const other = start(OTHER_MULTI_LEADER);
    play(other, ID);
    accept(other);
    payDon(other);
    expect(leaderPower(other)).toBe(5000);
    expect(don(other, 'p1').deck).toBe(2);
  });

  it('declining the DON!! -2 does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(leaderPower(g)).toBe(5000);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('[When Attacking] fires the same way', () => {
    const g = mk(
      { leader: SHC_MULTI_LEADER, characters: [ID], costArea: { active: 4, rested: 0 } },
      { characters: [V.c1], costArea: { active: 6, rested: 0 } },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    accept(g);
    payDon(g);
    expect(leaderPower(g)).toBe(7000);
    passBlock(g);
    endCounter(g);
    expect(leaderPower(g)).toBe(7000);
  });
});
