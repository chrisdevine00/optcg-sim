/** OP12-013 Hatchan. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, pick, V } from './helpers.ts';
import { activateAb, at, canActivate, choices, EVENTS, isRested, mk } from './helpers-op12g1.ts';

const ID = 'OP12-013';

describe('OP12-013 Hatchan', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    mk({
      characters: [ID, V.c3],
      hand: [...EVENTS, V.c1],
      costArea: { active: 4, rested: 3 },
      ...p1,
    });
  const use = (g: ReturnType<typeof start>) => {
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', EVENTS[0]), g.find('p1', 'hand', EVENTS[1])]);
  };

  it('[Activate: Main]: rest this Character and reveal 2 Events: give up to 2 rested DON!! to your Leader or 1 Character', () => {
    const g = start();
    use(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    // "up to 2": a count, most first.
    expectDecision(g, 'choose', 'p1');
    option(g, '2');
    // Targets: the Leader and every Character (Hatchan included).
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', ID), at(g, 'p1', 'characters', V.c3)].sort(),
    );
    pick(g, [at(g, 'p1', 'characters', V.c3)]);
    expect(g.card(at(g, 'p1', 'characters', V.c3)).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1, given: 2 });
  });

  it('a count of 1 gives 1; a count of 0 ("None") gives nothing but the cost is paid', () => {
    const g = start();
    use(g);
    option(g, '1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(2);
    const h = start();
    use(h);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ rested: 3, given: 0 });
    expect(isRested(h, at(h, 'p1', 'characters', ID))).toBe(true);
  });

  it('with a single rested DON!! no count is asked, only the target', () => {
    const g = start({ costArea: { active: 4, rested: 1 } });
    use(g);
    expectDecision(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ rested: 0, given: 1 });
  });

  it('with no rested DON!! the cost is paid and nothing is given', () => {
    const g = start({ costArea: { active: 4, rested: 0 } });
    use(g);
    expect(dec(g)?.kind).toBe('main');
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    expect(don(g, 'p1').given).toBe(0);
  });

  it('not offered with fewer than 2 Events in hand, or when this Character is already rested', () => {
    const g = start({ hand: [EVENTS[0], V.c1] });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
    const h = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(h, at(h, 'p1', 'characters', ID), 'activate')).toBe(false);
  });
});
