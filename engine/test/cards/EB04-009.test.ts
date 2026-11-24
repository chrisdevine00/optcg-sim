/** EB04-009 It's My Student's Farewell. I Want It to Be Proper. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  none,
  pick,
  play,
  takeDamage,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { at, canPick, mk, RAYLEIGH_C, RAYLEIGH_LEADER, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-009';

describe("EB04-009 It's My Student's Farewell. I Want It to Be Proper.", () => {
  const start = (p1: Record<string, unknown> = {}) =>
    mk(
      { leader: RAYLEIGH_LEADER, hand: [ID], costArea: { active: 3, rested: 0 }, ...p1 } as never,
      { characters: [V.c5] },
    );

  it('[Main]: give 1 active DON!! to your [Silvers Rayleigh] Leader: -2000 on up to 1 opposing Character', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(5000);
    expect(don(g, 'p1')).toMatchObject({ active: 2, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('also works with a [Silvers Rayleigh] Character (the DON!! goes to it)', () => {
    const g = start({ leader: RED_LEADER, characters: [RAYLEIGH_C] });
    play(g, ID);
    accept(g);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.card(at(g, 'p1', 'characters', RAYLEIGH_C)).don).toBe(1);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(5000);
  });

  it('"You may": declining the cost gives nothing and does nothing (the Event is still played)', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, given: 0 });
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('with no [Silvers Rayleigh] on your field the cost cannot be paid: accepting is not legal (only declining)', () => {
    const g = start({ leader: RED_LEADER, characters: [V.c3] });
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
    expect(don(g, 'p1').given).toBe(0);
  });

  it('with no active DON!! (only rested) the cost cannot be paid', () => {
    const g = start({ costArea: { active: 0, rested: 3 } });
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(don(g, 'p1').given).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
  });

  it('"up to 1": the power target may be skipped after paying', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(don(g, 'p1').given).toBe(1);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
  });

  it('[Counter]: a Rayleigh Leader or any Character gains +2000 during this battle (a non-Rayleigh Leader is not a target)', () => {
    const g = counterStep({
      leader: RED_LEADER,
      hand: [ID],
      characters: [V.c3],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, at(g, 'p1', 'characters', V.c3))).toBe(true);
    pick(g, [at(g, 'p1', 'characters', V.c3)]);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(7000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(at(g, 'p1', 'characters', V.c3))).toBe(5000);
  });

  it('[Counter]: a [Silvers Rayleigh] Leader is a target', () => {
    const g = counterStep({
      leader: RAYLEIGH_LEADER,
      hand: [ID],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});
