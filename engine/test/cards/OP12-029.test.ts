/** OP12-029 Shimotsuki Kouzaburou. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { at, choices, isRested, mk, rested } from './helpers-op12g1.ts';

const ID = 'OP12-029';

describe('OP12-029 Shimotsuki Kouzaburou', () => {
  const start = (opp: unknown[]) => mk({ hand: [ID] }, { characters: opp as string[] });

  it('[On Play]: rests an opposing Character with cost 2 or less, then K.O.s a rested one with base cost 1 or less (it may be the one just rested)', () => {
    const g = start([V.c1, V.c3]);
    play(g, ID);
    // Boundary: cost 1 offered, cost 3 not.
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c1)]);
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    // The rested cost 1 is now a K.O. candidate.
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c1)]);
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c1]);
  });

  it('the rest accepts cost 2 exactly; a rested cost 2 is not K.O.d (base cost 2 is above 1)', () => {
    const g = start([V.c2, V.c1]);
    play(g, ID);
    expect(choices(g).sort()).toEqual(
      [at(g, 'p2', 'characters', V.c2), at(g, 'p2', 'characters', V.c1)].sort(),
    );
    pick(g, [at(g, 'p2', 'characters', V.c2)]);
    // K.O. step: only rested Characters with base cost 1 or less; the active cost 1 and the cost 2 are out.
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(isRested(g, at(g, 'p2', 'characters', V.c2))).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"Then" is not "If you do": declining the rest still K.O.s an already-rested base cost 1 Character', () => {
    const g = start([rested(V.c1), V.c2]);
    play(g, ID);
    none(g);
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c1)]);
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c1]);
    expect(isRested(g, at(g, 'p2', 'characters', V.c2))).toBe(false);
  });

  it('an active base cost 1 Character is not a K.O. candidate unless it was just rested', () => {
    const g = start([V.c1]);
    play(g, ID);
    none(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"up to 1": the K.O. may be skipped', () => {
    const g = start([rested(V.c1)]);
    play(g, ID);
    none(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with no opposing Characters nothing is asked and the Character is still played', () => {
    const g = start([]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
