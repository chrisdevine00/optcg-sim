/** ST23-004 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, none, pick } from './helpers.ts';
import { activateAb, at, canActivate, choices, isRested, mk, V } from './helpers-lfb.ts';

const ID = 'ST23-004';

describe('ST23-004 Monkey.D.Luffy', () => {
  const start = (mine: Parameters<typeof mk>[0] = {}) =>
    mk(
      { characters: [ID], costArea: { active: 3, rested: 0 }, ...mine },
      { characters: [V.c3, V.c1] },
    );
  const use = (g: ReturnType<typeof start>) =>
    activateAb(g, at(g, 'p1', 'characters', ID), 'shrink');

  it("[Activate: Main]: rest 1 DON!! and this Character: up to 1 of your opponent's Characters gets -1000 power during this turn", () => {
    const g = start();
    use(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expectDecision(g, 'choose', 'p1');
    // Opposing Characters only (not the Leader, not mine).
    expect(choices(g).sort()).toEqual(
      [at(g, 'p2', 'characters', V.c3), at(g, 'p2', 'characters', V.c1)].sort(),
    );
    pick(g, [at(g, 'p2', 'characters', V.c3)]);
    expect(g.power(at(g, 'p2', 'characters', V.c3))).toBe(4000);
    expect(g.power(at(g, 'p2', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": the target can be declined, the cost is still paid', () => {
    const g = start();
    use(g);
    none(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', V.c3))).toBe(5000);
  });

  it("can go below 0 (the 3000 Character shrinks to 2000, nothing is K.O.'d)", () => {
    const g = start();
    use(g);
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    expect(g.power(at(g, 'p2', 'characters', V.c1))).toBe(2000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('must not be offered with no active DON!! or when this Character is already rested', () => {
    const noDon = start({ costArea: { active: 0, rested: 3 } });
    expect(canActivate(noDon, at(noDon, 'p1', 'characters', ID), 'shrink')).toBe(false);
    const rested = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(rested, at(rested, 'p1', 'characters', ID), 'shrink')).toBe(false);
  });

  it('is not Once Per Turn on its own, but resting the Character stops a second use', () => {
    const g = start();
    use(g);
    none(g);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'shrink')).toBe(false);
  });
});
