/** OP12-031 Tashigi. */
import { describe, expect, it } from 'vitest';
import { dec, don, none, option, pick, play, V } from './helpers.ts';
import { at, choices, isRested, mk, RED_LEADER, ZORO_LEADER } from './helpers-op12g1.ts';

const ID = 'OP12-031';

describe('OP12-031 Tashigi', () => {
  const start = (p1: Record<string, unknown> = {}, opp: string[] = [V.c6, V.c7]) =>
    mk({ leader: ZORO_LEADER, hand: [ID], costArea: { active: 8, rested: 0 }, ...p1 } as never, {
      characters: opp,
    });

  it('[On Play]: rests an opposing Character with base cost 6 or less, then gives up to 3 rested DON!! to your [Roronoa Zoro] Leader', () => {
    const g = start();
    play(g, ID);
    // Boundary: base cost 6 offered, 7 not.
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c6)]);
    pick(g, [at(g, 'p2', 'characters', V.c6)]);
    expect(isRested(g, at(g, 'p2', 'characters', V.c6))).toBe(true);
    // Tashigi's own cost rested 5 DON!!; with 3 more given, 2 stay rested.
    option(g, '3');
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, given: 3 });
  });

  it('"up to 3" is a count (1 and None are possible)', () => {
    const g = start();
    play(g, ID);
    pick(g, [at(g, 'p2', 'characters', V.c6)]);
    option(g, '1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = start();
    play(h, ID);
    pick(h, [at(h, 'p2', 'characters', V.c6)]);
    option(h, '0');
    expect(h.card(h.leader('p1')).don).toBe(0);
  });

  it('"Then" is not "If you do": skipping the rest, or nothing to rest, still gives the DON!!', () => {
    const g = start();
    play(g, ID);
    none(g);
    option(g, '3');
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(isRested(g, at(g, 'p2', 'characters', V.c6))).toBe(false);
    const h = start({}, [V.c7]);
    play(h, ID);
    option(h, '3');
    expect(h.card(h.leader('p1')).don).toBe(3);
  });

  it('a Leader that is not [Roronoa Zoro] gets no DON!! (and nothing is asked)', () => {
    const g = start({ leader: RED_LEADER });
    play(g, ID);
    pick(g, [at(g, 'p2', 'characters', V.c6)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(isRested(g, at(g, 'p2', 'characters', V.c6))).toBe(true);
  });
});
