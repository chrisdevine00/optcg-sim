/** OP14-077 Penta-Chromatic String. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, none, pick, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { DP_LEADER } from './helpers-op14g3.ts';

const ID = 'OP14-077';

describe('OP14-077 Penta-Chromatic String', () => {
  const start = (attacker: string, chars: string[] = []) =>
    counterStep(
      { leader: DP_LEADER, hand: [ID], characters: chars, costArea: { active: 2, rested: 0 } },
      {},
      attacker,
    );

  it('[Counter] up to 1 of your Leader or Character cards gains +4000 power during this battle', () => {
    const g = start(V.c7, [V.c1]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('a Character may be the target', () => {
    const g = start(V.c7, [V.c1]);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('then, if your opponent has a Character with 6000 power or more, add up to 1 DON!! rested', () => {
    const g = start(V.c4); // the attacker has exactly 6000
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('with only a 5000 power Character nothing is added (boundary)', () => {
    const g = start(V.c3);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(don(g, 'p1').deck).toBe(8);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the DON!! is added even when no target was chosen ("Then, if" is independent), and "up to" allows none', () => {
    const g = start(V.c7);
    useCounter(g, ID);
    none(g);
    addMost(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('a 3000 power Character does not count', () => {
    const g = start(V.c1); // 3000 power attacker
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).not.toBe('choose');
  });
});
