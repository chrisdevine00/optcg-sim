/** OP10-029 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk, OD, rested } from './helpers-a10g1.ts';

const ID = 'OP10-029';

describe('OP10-029 Dracule Mihawk', () => {
  it('[On Play]: with 2 rested Characters, sets up to 1 rested {ODYSSEY} Character (cost 5 or less) as active', () => {
    const g = mk({ hand: [ID], characters: [rested(OD.c4), rested(V.c1)] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', OD.c4)]);
    expect(g.card(g.find('p1', 'characters', OD.c4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });

  it('boundary: cost 5 can be set active, cost 6 cannot; only {ODYSSEY} and only rested ones are candidates', () => {
    const g = mk({
      hand: [ID],
      characters: [rested(OD.c5), rested(OD.c6), rested(V.c1), OD.c4],
    });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', OD.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', OD.c6))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', OD.c4))).toBe(false); // active already
  });

  it('"up to 1": may set nothing, and only one of two candidates', () => {
    const g = mk({ hand: [ID], characters: [rested(OD.c4), rested(OD.c5)] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p1', 'characters', OD.c4)).rested).toBe(true);
    const h = mk({ hand: [ID], characters: [rested(OD.c4), rested(OD.c5)] });
    play(h, ID);
    pick(h, [h.find('p1', 'characters', OD.c4), h.find('p1', 'characters', OD.c5)].slice(0, 1));
    expect(h.zone('p1', 'characters').filter((c) => c.card !== ID && !c.rested)).toHaveLength(1);
  });

  it('must not do anything with only 1 rested Character', () => {
    const g = mk({ hand: [ID], characters: [rested(OD.c4), V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', OD.c4)).rested).toBe(true);
  });
});
