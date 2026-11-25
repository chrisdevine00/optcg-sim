/** OP12-117 Slam Gibson (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  play,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-op11g3.ts';
import { COST10, COST9, SLASH_LEADER } from './helpers-w7c2.ts';

const ID = 'OP12-117';

describe('OP12-117 Slam Gibson [Main]', () => {
  /** p1 (Supernovas Leader by default) holds the Event with 6 DON!!; p2 has two Characters and 3 Life. */
  const start = (leader = SLASH_LEADER, mine: string[] = [V.c3], theirs = [COST9, COST10]) =>
    game(
      { leader, hand: [ID], characters: mine, costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: theirs, life: [V.c1, V.c2, V.c3] },
    );
  const life = (g: ReturnType<typeof start>, p: 'p1' | 'p2') => g.zone(p, 'life');

  it("adds the opponent's Character to the top of their Life face-down", () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 }); // 1 for the Event, 5 for the cost
    pick(g, [g.find('p2', 'characters', COST9)]);
    option(g, 'top');
    expect(life(g, 'p2').map((c) => c.card)).toEqual([COST9, V.c1, V.c2, V.c3]);
    expect(life(g, 'p2')[0]!.faceUp).toBe(false);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([COST10]);
    expect(g.life('p1')).toBe(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('or to the bottom, the controller choosing', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', COST9)]);
    option(g, 'bottom');
    expect(life(g, 'p2').map((c) => c.card)).toEqual([V.c1, V.c2, V.c3, COST9]);
  });

  it('your own Character goes to your own Life', () => {
    const g = start(SLASH_LEADER, [V.c3], []);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    option(g, 'top');
    expect(life(g, 'p1').map((c) => c.card)[0]).toBe(V.c3);
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(3);
  });

  it('boundary: a cost of 9 can be chosen, a cost of 10 cannot', () => {
    const g = start();
    play(g, ID);
    accept(g);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toContain(g.find('p2', 'characters', COST9));
    expect(offered).not.toContain(g.find('p2', 'characters', COST10));
  });

  it('"up to 1": may choose nobody', () => {
    const g = start();
    play(g, ID);
    accept(g);
    g.act({ type: 'done' });
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.life('p2')).toBe(3);
  });

  it('a Leader without the "Supernovas" type: the DON!! are rested, nothing moves', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });

  it('the cost is optional: declining rests no DON!! and moves nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
    expect(g.life('p2')).toBe(3);
  });

  it('with fewer than 5 active DON!! left the cost cannot be accepted: nothing moves', () => {
    const g = game(
      { leader: SLASH_LEADER, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [COST9], life: [V.c1, V.c2, V.c3] },
    );
    play(g, ID);
    expectDecision(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.life('p2')).toBe(3);
  });
});

describe('OP12-117 Slam Gibson [Counter]', () => {
  it('your Leader gains +3000 power during this battle', () => {
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
