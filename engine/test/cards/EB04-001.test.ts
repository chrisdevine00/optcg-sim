/** EB04-001 Jewelry Bonney (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, none, pick } from './helpers.ts';
import { activateAb, at, canActivate, mk, oppTurn, V, BLUE, PURPLE } from './helpers-eb04g1.ts';

const ID = 'EB04-001';
const life = (n: number) => Array.from({ length: n }, () => BLUE);

describe('EB04-001 Jewelry Bonney', () => {
  it("[Opponent's Turn]: with 1 Life this Leader has +2000 (7000); with 0 too; with 2 Life it has 5000", () => {
    for (const [n, power] of [
      [0, 7000],
      [1, 7000],
      [2, 5000],
    ] as const) {
      const g = mk({ leader: ID, life: life(n) }, {}, oppTurn);
      expect(g.power(g.leader('p1'))).toBe(power);
    }
  });

  it("the +2000 is for the opponent's turn only: on your own turn with 1 Life it stays 5000", () => {
    const g = mk({ leader: ID, life: life(1) });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Activate: Main]: -1000 on up to 1 opposing Character; with 2 Life you may add the top Life card to your hand', () => {
    const g = mk({ leader: ID, life: [PURPLE, BLUE, BLUE] }, { characters: [V.c5, V.c3] });
    activateAb(g, g.leader('p1'), 'activate');
    expectDecision(g, 'choose', 'p1');
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(6000);
    expect(g.power(at(g, 'p2', 'characters', V.c3))).toBe(5000);
    accept(g);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(2);
  });

  it('with exactly 1 Life ("2 or more" not met) no Life prompt is asked, but the power is still given', () => {
    const g = mk({ leader: ID, life: life(1) }, { characters: [V.c5] });
    activateAb(g, g.leader('p1'), 'activate');
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(6000);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(1);
  });

  it('with exactly 2 Life the boundary is met; declining keeps the Life card', () => {
    const g = mk({ leader: ID, life: life(2) }, { characters: [V.c5] });
    activateAb(g, g.leader('p1'), 'activate');
    none(g);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the Life step is offered even with no opposing Character (the power is "up to 1")', () => {
    const g = mk({ leader: ID, life: life(3) });
    activateAb(g, g.leader('p1'), 'activate');
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.life('p1')).toBe(2);
  });

  it('Once Per Turn: not offered again after use', () => {
    const g = mk({ leader: ID, life: life(3) }, { characters: [V.c5] });
    activateAb(g, g.leader('p1'), 'activate');
    none(g);
    decline(g);
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });
});
