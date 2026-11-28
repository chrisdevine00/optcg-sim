/** OP18-086 Goldberg. */
import { describe, expect, it } from 'vitest';
import { none, pick, V } from './helpers.ts';
import { candidates, koByEffect } from './helpers-a10g1.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-086';

describe('OP18-086 Goldberg', () => {
  it('gains +12 cost on the field (base cost 3, so 15) and not in the hand', () => {
    const g = mine({ characters: [ID], hand: [ID] }, {});
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(15);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
  });

  it("[On K.O.] K.O. up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = mine({ characters: [ID] }, { characters: [V.c4, V.c5, V.c2] });
    koByEffect(g, 'p1', ID);
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c2, V.c5].sort());
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c4]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = mine({ characters: [ID] }, { characters: [V.c4] });
    koByEffect(g, 'p1', ID);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a Character with a cost of 5 is not a candidate', () => {
    const g = mine({ characters: [ID] }, { characters: [V.c5] });
    koByEffect(g, 'p1', ID);
    expect(candidates(g)).toEqual([]);
  });
});
