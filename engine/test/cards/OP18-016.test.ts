/** OP18-016 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { none, pick, V } from './helpers.ts';
import { koByEffect } from './helpers-op14g4.ts';
import { canPick } from './helpers-w3s.ts';
import { AA5, ALA1, ALA5, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-016';
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP18-016 Monkey.D.Luffy', () => {
  it('has [Banish]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Banish');
  });

  it('[On K.O.] play up to 1 {Alabasta} Character with 6000 power or less from your hand', () => {
    const g = mk({ characters: [ID], hand: [ALA5] });
    koByEffect(g, 'p1', ID);
    pick(g, [g.find('p1', 'hand', ALA5)]);
    expect(chars(g)).toEqual([ALA5]);
  });

  it('boundary: 6000 is offered; 7000 and a non-{Alabasta} 6000 are not', () => {
    const g = mk({ characters: [ID], hand: [ALA5, AA5, V.c4, ALA1] });
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'hand', ALA5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ALA1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', AA5))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk({ characters: [ID], hand: [ALA5] });
    koByEffect(g, 'p1', ID);
    none(g);
    expect(chars(g)).toEqual([]);
  });

  it('the card is played for free (no DON!! spent)', () => {
    const g = mk({ characters: [ID], hand: [ALA5], costArea: { active: 0, rested: 0 } });
    koByEffect(g, 'p1', ID);
    pick(g, [g.find('p1', 'hand', ALA5)]);
    expect(chars(g)).toEqual([ALA5]);
  });
});
