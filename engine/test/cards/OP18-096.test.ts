/** OP18-096 I'll Make the Call. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { CP_L, HK1, HK8, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-096';
const fill = (n: number) => Array.from({ length: n }, () => V.c1);

const main = (trash: string[], active = 4) =>
  game(
    { leader: CP_L, hand: [ID], trash, costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe("OP18-096 I'll Make the Call", () => {
  it('[Main] rest 3 DON!!: play a {Holy Knights of God} Character with a cost of 6 or less from the trash', () => {
    const g = main([HK1, HK8, V.c1]);
    play(g, ID);
    accept(g);
    expect(candidates(g)).toEqual([g.find('p1', 'trash', HK1)]); // cost 8 is too high, not a {HKoG}
    pick(g, [g.find('p1', 'trash', HK1)]);
    expect(zoneOf(g, 'p1', 'characters')).toEqual([HK1]);
    expect(don(g, 'p1').rested).toBe(4); // 1 for the Event, 3 rested as the cost
  });

  it('"you may": declining rests no DON!! and plays nothing', () => {
    const g = main([HK1]);
    play(g, ID);
    decline(g);
    expect(zoneOf(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('cannot be paid with fewer than 3 active DON!! left', () => {
    const g = main([HK1], 3); // the Event costs 1, 2 remain
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  // The Event is trashed before its effect resolves, so it counts itself: 9 other cards make 10.
  it('[Counter] with 9 other cards in your trash (10 with the Event): +4000 power during this battle', () => {
    const g = counterStep(
      { leader: CP_L, hand: [ID], trash: fill(9), costArea: { active: 1, rested: 0 } },
      {},
    );
    const before = g.power(g.leader('p1'));
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(before! + 4000);
  });

  it('[Counter] with 8 other cards in your trash (9 with the Event) nothing happens', () => {
    const g = counterStep(
      { leader: CP_L, hand: [ID], trash: fill(8), costArea: { active: 1, rested: 0 } },
      {},
    );
    const before = g.power(g.leader('p1'));
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(before);
    expectDecision(g, 'counter', 'p1');
  });
});
