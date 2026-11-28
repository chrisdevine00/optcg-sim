/** OP18-029 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { addMost, expectDecision } from './helpers.ts';
import { finishBattle, mine, skipRefreshOn } from './helpers-op18-g2.ts';

const ID = 'OP18-029';
const attack = (rested: number, active = 0) => {
  const g = mine({ characters: [ID], costArea: { active, rested } });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  // "up to 3": the engine asks how many; take the most.
  if (rested > 0) addMost(g);
  return g;
};

describe('OP18-029 Tony Tony.Chopper', () => {
  it('has [Rush]: it can attack the turn it is played', () => {
    const g = mine({ hand: [ID], costArea: { active: 9, rested: 0 } });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    const c = g.find('p1', 'characters', ID);
    expect(g.card(c).keywords).toContain('Rush');
    expect(g.isLegal({ type: 'attack', attacker: c, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
  });

  it('[When Attacking] gives up to 3 rested DON!! to your Leader, sets itself active, and skips its next Refresh', () => {
    const g = attack(4);
    const c = g.find('p1', 'characters', ID);
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(g.card(c).rested).toBe(false); // rested by the attack, set active by the effect
    expect(skipRefreshOn(g, c)).toBe(1);
    expectDecision(g, 'block', 'p2');
  });

  it('gives as many as there are when fewer than 3 are rested', () => {
    const g = attack(2, 2);
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('with no rested DON!! the rest of the effect still happens ("Then" is not "If you do")', () => {
    const g = attack(0, 3);
    const c = g.find('p1', 'characters', ID);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(c).rested).toBe(false);
    expect(skipRefreshOn(g, c)).toBe(1);
  });

  it('[Once Per Turn]: a second attack the same turn gives no more DON!!', () => {
    const g = attack(6);
    finishBattle(g);
    expect(g.card(g.leader('p1')).don).toBe(3);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2'); // no count was asked
    expect(g.card(g.leader('p1')).don).toBe(3);
  });
});
