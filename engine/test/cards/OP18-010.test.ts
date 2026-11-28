/** OP18-010 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { hand, none, pick, V } from './helpers.ts';
import { koByEffect } from './helpers-op14g4.ts';
import { canPick } from './helpers-w3s.ts';
import { mk } from './helpers-op18-g1.ts';

const ID = 'OP18-010';
const EVENT = 'ST02-017';

describe('OP18-010 Tony Tony.Chopper', () => {
  it('[On K.O.] add up to 1 Character with 4000 power or less from your trash to your hand', () => {
    const g = mk({ characters: [ID], trash: [V.c2, V.c1] });
    koByEffect(g, 'p1', ID);
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('boundary: 4000 is offered, 5000 and an Event are not', () => {
    const g = mk({ characters: [ID], trash: [V.c2, V.c3, EVENT] });
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'trash', V.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', V.c3))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', EVENT))).toBe(false);
  });

  it('Chopper himself (5000 power) is in the trash but not a candidate', () => {
    const g = mk({ characters: [ID], trash: [V.c1] });
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false);
  });

  it('"up to 1": may take nothing', () => {
    const g = mk({ characters: [ID], trash: [V.c2] });
    koByEffect(g, 'p1', ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
