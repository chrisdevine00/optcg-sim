/** OP18-101 Kumadori. OP-18 wave G3. */
import { describe, expect, it } from 'vitest';
import { hand, option, pick, V } from './helpers.ts';
import { ids, mk, OPP, plantOpponentEffect } from './helpers-a10g1.ts';
import { CP2 } from './helpers-op18-w2.ts';

const ID = 'OP18-101';

describe('OP18-101 Kumadori', () => {
  it('[On K.O.] adds a "CP" card from hand to the top or bottom of Life face-up', () => {
    const g = mk({ characters: [ID], hand: [CP2, V.c1], life: [V.c2] }, {}, OPP);
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    pick(g, [g.find('p1', 'hand', CP2)]);
    option(g, 'bottom');
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c2, CP2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });
});
