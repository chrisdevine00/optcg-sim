/** OP11-114 Gum-Gum Fire-Fist Pistol Red Hawk (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  endCounter,
  expectDecision,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  times,
  V,
} from './helpers.ts';
import { canPick, counterStep, idsOf, mk, useCounter } from './helpers-op11g3.ts';

const ID = 'OP11-114';

describe('OP11-114 Gum-Gum Fire-Fist Pistol Red Hawk', () => {
  const start = (mine: number, theirs: number) =>
    mk(
      { hand: [ID], life: times(mine, BLUE) },
      { life: times(theirs, PURPLE), characters: [V.c5, V.c6] },
    );

  it('[Main]: rest 3 DON!!: with 5 or more Life cards in total, K.O. up to 1 opposing Character with a base cost of 5 or less', () => {
    const g = start(3, 2);
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // base cost 5: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it("4 Life cards in total is not enough (the boundary): the cost is paid, nothing is K.O.'d", () => {
    const g = start(2, 2);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 4 });
  });

  it("both players' Life counts: 0 mine and 5 theirs is enough", () => {
    const g = start(0, 5);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('choose');
  });

  it('the cost is optional: declining rests no DON!! and K.O.s nothing', () => {
    const g = start(3, 3);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start(3, 3);
    play(g, ID);
    accept(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 3, rested: 0 } },
      {},
      V.c5,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
