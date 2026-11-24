/** OP12-019 Color of Arms Haki. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  none,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { at, choices, mk, RAYLEIGH_LEADER, RED_LEADER } from './helpers-op12g1.ts';

const ID = 'OP12-019';

describe('OP12-019 Color of Arms Haki', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    mk({
      leader: RAYLEIGH_LEADER,
      hand: [ID],
      characters: [V.c3],
      costArea: { active: 3, rested: 0 },
      ...p1,
    });

  it('[Main]: give 1 active DON!! to your [Silvers Rayleigh]: up to 1 Leader or Character gains +1000 power this turn', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, given: 1 });
    // Any Leader or Character is a target, not only a Rayleigh.
    expect(choices(g).sort()).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V.c3)].sort());
    pick(g, [at(g, 'p1', 'characters', V.c3)]);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(6000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
  });

  it('the Leader may be the target (its own given DON!! add +1000 too)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.leader('p1')]);
    // 5000 + 1000 (DON!! given on your turn) + 1000.
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1": the target may be skipped after paying', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(don(g, 'p1').given).toBe(1);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
  });

  it('declining gives no DON!! and no power', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, given: 0 });
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
  });

  it('with no [Silvers Rayleigh] the cost cannot be paid', () => {
    const g = start({ leader: RED_LEADER });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Counter]: +2000 on one of your Characters or a [Silvers Rayleigh] Leader during this battle', () => {
    const g = counterStep({
      leader: RAYLEIGH_LEADER,
      hand: [ID],
      characters: [V.c3],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: a non-Rayleigh Leader is not a target', () => {
    const g = counterStep({
      leader: RED_LEADER,
      hand: [ID],
      characters: [V.c3],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', V.c3)]);
  });
});
