/** OP18-087 Stansen. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-087';
const GOLDBERG = 'OP18-086'; // also +12 cost
const power = (chars: string[], opp: string[] = []) => {
  const g = mine({ characters: chars }, { characters: opp });
  return { g, p: g.power(g.find('p1', 'characters', ID)) };
};

describe('OP18-087 Stansen', () => {
  it('gains +12 cost on the field (base cost 3, so 15)', () => {
    const { g } = power([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(15);
  });

  it('alone, or with only Characters with a cost of 12 or more, it gains +2000 power', () => {
    expect(power([ID]).p).toBe(6000);
    expect(power([ID, GOLDBERG]).p).toBe(6000);
    expect(power([ID, ID]).p).toBe(6000);
  });

  it('with any Character with a cost of 11 or less it stays at 4000', () => {
    expect(power([ID, V.c1]).p).toBe(4000);
    expect(power([ID, GOLDBERG, V.c7]).p).toBe(4000);
  });

  it("your opponent's Characters do not matter", () => {
    expect(power([ID], [V.c1, V.c5]).p).toBe(6000);
  });
});
