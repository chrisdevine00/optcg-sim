/** OP14-078 Bullet String. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  endCounter,
  none,
  payDon,
  pick,
  takeDamage,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { DP_LEADER, OTHER_LEADER } from './helpers-op14g3.ts';

const ID = 'OP14-078';

describe('OP14-078 Bullet String', () => {
  const start = (leader: string, active = 3, chars: string[] = []) =>
    counterStep({ leader, hand: [ID], characters: chars, costArea: { active, rested: 0 } });

  it('[Counter] DON!! -1: Leader +2000 during this battle, then an additional +2000 during this turn', () => {
    const g = start(DP_LEADER);
    useCounter(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(don(g, 'p1').deck).toBe(8);
    endCounter(g);
    takeDamage(g);
    // The battle bonus has ended; the "during this turn" one lasts until the end of the turn.
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Character may be the target; the Leader gets nothing', () => {
    const g = start(DP_LEADER, 3, [V.c1]);
    useCounter(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": with no target neither bonus is given (the DON!! -1 is still paid)', () => {
    const g = start(DP_LEADER);
    useCounter(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with a Leader that is not {Donquixote Pirates} the DON!! is returned and no power is given', () => {
    const g = start(OTHER_LEADER);
    useCounter(g, ID);
    accept(g);
    payDon(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('declining the DON!! -1 (it reads "You may return", RL-52): no DON!! returns and no power is given', () => {
    const g = start(DP_LEADER);
    useCounter(g, ID);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('with no active DON!! to pay the Event the Counter cannot be played', () => {
    const g = start(DP_LEADER, 1);
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'hand', ID),
        ability: 'counter',
        player: 'p1',
      }),
    ).toBe(false);
  });
});
