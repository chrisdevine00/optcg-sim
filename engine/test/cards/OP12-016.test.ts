/** OP12-016 To Never Doubt--That Is Power!. */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { at, choices, mk, RAYLEIGH_C, RAYLEIGH_LEADER, RED_LEADER } from './helpers-op12g1.ts';

const ID = 'OP12-016';
/** A Yellow Character with [Blocker], cost 2. */
const BLOCKER = 'ST29-011';

describe('OP12-016 To Never Doubt--That Is Power!', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    mk(
      { leader: RAYLEIGH_LEADER, hand: [ID], costArea: { active: 4, rested: 0 }, ...p1 },
      { characters: [BLOCKER] },
    );
  /** p1 attacks p2's Leader with `attacker`; true when a [Blocker] may be declared. */
  const blockable = (g: ReturnType<typeof start>, attacker: InstanceId): boolean => {
    g.act({ type: 'attack', attacker, target: g.leader('p2') });
    return (
      dec(g)?.kind === 'block' && g.legal().some((a) => a.type === 'block' && a.blocker !== null)
    );
  };

  it('[Main]: give 2 active DON!! to your [Silvers Rayleigh]: the opponent cannot activate [Blocker] when it attacks', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, given: 2 });
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(blockable(g, g.leader('p1'))).toBe(false);
  });

  it('without the Event a Blocker may block (control)', () => {
    const g = start({ hand: [] });
    expect(blockable(g, g.leader('p1'))).toBe(true);
  });

  it('the restriction follows the card that was given the DON!!: a Rayleigh Character, not the Leader', () => {
    const g = start({ characters: [RAYLEIGH_C] });
    play(g, ID);
    accept(g);
    // Two [Silvers Rayleigh]: the Leader and the Character; give to the Character.
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', RAYLEIGH_C)].sort(),
    );
    pick(g, [at(g, 'p1', 'characters', RAYLEIGH_C)]);
    expect(g.card(at(g, 'p1', 'characters', RAYLEIGH_C)).don).toBe(2);
    // The Leader's attack can still be blocked.
    expect(blockable(g, g.leader('p1'))).toBe(true);
  });

  it('the restriction covers the Character that was given the DON!! when it attacks', () => {
    const g = start({ characters: [RAYLEIGH_C] });
    play(g, ID);
    accept(g);
    pick(g, [at(g, 'p1', 'characters', RAYLEIGH_C)]);
    expect(blockable(g, at(g, 'p1', 'characters', RAYLEIGH_C))).toBe(false);
  });

  it('"You may": declining gives no DON!! and no restriction (the Event is still played)', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, given: 0 });
    expect(blockable(g, g.leader('p1'))).toBe(true);
  });

  it('with only 1 active DON!! left, or no [Silvers Rayleigh], the cost cannot be paid', () => {
    const g = start({ costArea: { active: 1, rested: 0 } });
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    const h = start({ leader: RED_LEADER, characters: [V.c3] });
    play(h, ID);
    expect(h.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Counter]: +2000 on one of your Characters or a [Silvers Rayleigh] Leader during this battle', () => {
    const g = counterStep({
      leader: RAYLEIGH_LEADER,
      hand: [ID],
      characters: [V.c3],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expect(choices(g).sort()).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V.c3)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: a Leader that is not [Silvers Rayleigh] is not a target', () => {
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
