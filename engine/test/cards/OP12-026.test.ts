/** OP12-026 Kuina. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, pick, V } from './helpers.ts';
import {
  activateAb,
  at,
  canActivate,
  choices,
  isRested,
  mk,
  RED_LEADER,
  rested,
  ZORO_LEADER,
} from './helpers-op12g1.ts';

const ID = 'OP12-026';

describe('OP12-026 Kuina', () => {
  const start = (p1: Record<string, unknown> = {}, opp: unknown[] = [V.c4, V.c5]) =>
    mk(
      { leader: ZORO_LEADER, characters: [ID], costArea: { active: 2, rested: 4 }, ...p1 } as never,
      { characters: opp as string[] },
    );
  const use = (g: ReturnType<typeof start>) =>
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');

  it('[Activate: Main]: rest this Character: rest an opposing Character with base cost 4 or less, then give up to 3 rested DON!! to your [Roronoa Zoro] Leader', () => {
    const g = start();
    use(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    // Boundary: base cost 4 only (not 5).
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c4)]);
    pick(g, [at(g, 'p2', 'characters', V.c4)]);
    expect(isRested(g, at(g, 'p2', 'characters', V.c4))).toBe(true);
    expectDecision(g, 'choose', 'p1');
    option(g, '3');
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, given: 3 });
  });

  it('"up to 3" is a count: 1 gives 1; None gives nothing', () => {
    const g = start();
    use(g);
    pick(g, [at(g, 'p2', 'characters', V.c4)]);
    option(g, '1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = start();
    use(h);
    pick(h, [at(h, 'p2', 'characters', V.c4)]);
    option(h, '0');
    expect(h.card(h.leader('p1')).don).toBe(0);
  });

  it('fewer rested DON!! than 3: the count is capped by what is there', () => {
    const g = start({ costArea: { active: 2, rested: 2 } });
    use(g);
    pick(g, [at(g, 'p2', 'characters', V.c4)]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    option(g, '2');
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it('"Then" is not "If you do": no Character to rest still gives the DON!!', () => {
    const g = start({}, [V.c5]);
    use(g);
    option(g, '3');
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 1": the rest may be skipped and the DON!! still go out', () => {
    const g = start();
    use(g);
    g.act({ type: 'done' });
    option(g, '3');
    expect(isRested(g, at(g, 'p2', 'characters', V.c4))).toBe(false);
    expect(g.card(g.leader('p1')).don).toBe(3);
  });

  it('a Leader that is not [Roronoa Zoro] gets no DON!! and no count is asked', () => {
    const g = start({ leader: RED_LEADER });
    use(g);
    pick(g, [at(g, 'p2', 'characters', V.c4)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('not offered when this Character is already rested', () => {
    const g = start({ characters: [rested(ID)] });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
  });
});
