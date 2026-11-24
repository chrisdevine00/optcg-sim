/** EB04-008 Distorted Future. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, none, pick, play, takeDamage } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { at, BLUE, mk, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-008';
const life = (n: number) => Array.from({ length: n }, () => BLUE);

describe('EB04-008 Distorted Future', () => {
  const start = (n: number) =>
    mk({ leader: RED_LEADER, hand: [ID], life: life(n) }, { characters: [V.c5, V.c3] });

  it('[Main] with 2 Life: up to 1 opposing Character gets -3000 power during this turn', () => {
    const g = start(2);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(4000);
    expect(g.power(at(g, 'p2', 'characters', V.c3))).toBe(5000);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('the boundary: with 0 and 1 Life it works too', () => {
    for (const n of [0, 1]) {
      const g = start(n);
      play(g, ID);
      pick(g, [at(g, 'p2', 'characters', V.c5)]);
      expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(4000);
    }
  });

  it('with 3 Life nothing happens (no target prompt); the Event is still played and trashed', () => {
    const g = start(3);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = start(2);
    play(g, ID);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
  });

  it('-3000 can take a Character below 0 (3000 -> 0 shown as 0 or less)', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], life: life(1) }, { characters: [V.c1] });
    play(g, ID);
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    expect(g.power(at(g, 'p2', 'characters', V.c1))).toBeLessThanOrEqual(0);
  });

  it('[Counter]: your Leader gains +3000 power during this battle only', () => {
    const g = counterStep({ leader: RED_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
