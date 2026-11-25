/** ST23-005 Yasopp. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, pick } from './helpers.ts';
import { activateAb, at, canActivate, choices, mk, V } from './helpers-lfb.ts';

const ID = 'ST23-005';

describe('ST23-005 Yasopp', () => {
  const start = (active: number, rested: number) =>
    mk({ characters: [ID, V.c1], costArea: { active, rested } });
  const use = (g: ReturnType<typeof start>) =>
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');

  it('[Activate: Main] [Once Per Turn]: gives up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
    const g = start(3, 2);
    use(g);
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', ID), at(g, 'p1', 'characters', V.c1)].sort(),
    );
    pick(g, [at(g, 'p1', 'characters', V.c1)]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(at(g, 'p1', 'characters', V.c1))).toBe(4000);
  });

  it('the Leader may receive it', () => {
    const g = start(3, 2);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('gives exactly 1 even with several rested DON!!', () => {
    const g = start(0, 4);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, given: 1 });
  });

  it('only a RESTED DON!! is given: with none rested nothing happens and the turn use is spent', () => {
    const g = start(5, 0);
    use(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(false);
  });

  it('is Once Per Turn', () => {
    const g = start(0, 4);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(false);
  });
});
