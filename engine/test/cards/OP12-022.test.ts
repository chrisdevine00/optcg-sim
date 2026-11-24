/** OP12-022 Inuarashi. */
import { describe, expect, it } from 'vitest';
import { none, pick, V } from './helpers.ts';
import { activateAb, at, canActivate, choices, isRested, mk, rested } from './helpers-op12g1.ts';

const ID = 'OP12-022';

describe('OP12-022 Inuarashi', () => {
  const start = (opp: unknown[] = [rested(V.c5), rested(V.c6), V.c3]) =>
    mk({ characters: [ID] }, { characters: opp as string[] });
  const use = (g: ReturnType<typeof start>) =>
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');

  it('[Activate: Main]: rest this Character: an opposing rested Character with cost 5 or less will not become active in the next Refresh Phase', () => {
    const g = start();
    use(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    // Boundary: the rested cost 5 only (not the rested cost 6, not the active cost 3).
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', V.c5)]);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' });
    // The opponent's Refresh Phase: the cost 6 one becomes active, the chosen one stays rested.
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', V.c6))).toBe(false);
  });

  it('only the next Refresh Phase is skipped: the Character becomes active in the one after', () => {
    const g = start();
    use(g);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 1": may choose nothing (the cost is paid, the Character refreshes normally)', () => {
    const g = start();
    use(g);
    none(g);
    g.act({ type: 'endTurn' });
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('with no eligible rested Character the cost is still paid and nothing is asked', () => {
    const g = start([V.c3, rested(V.c7)]);
    use(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('not offered when this Character is already rested', () => {
    const g = mk({ characters: [rested(ID) as unknown as string] }, { characters: [rested(V.c5)] });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'activate')).toBe(false);
  });
});
