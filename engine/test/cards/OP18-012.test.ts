/** OP18-012 Pincers. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle } from './helpers-op14g1.ts';
import { AA1, ALA2, ANIMAL2, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-012';

describe('OP18-012 Pincers', () => {
  it('[When Attacking] up to 1 {Animal}{Alabasta} Character gains +1000 power this turn', () => {
    const g = mk({ characters: [ID, AA1] });
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', AA1)]);
    expect(g.power(g.find('p1', 'characters', AA1))).toBe(4000);
    finishBattle(g);
    expect(g.power(g.find('p1', 'characters', AA1))).toBe(4000); // still this turn
  });

  it('Pincers itself has both types and can be chosen', () => {
    const g = mk({ characters: [ID] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });

  it('a Character with only one of the two types is not a candidate', () => {
    const g = mk({ characters: [ID, ALA2, ANIMAL2, AA1] });
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p1', 'characters', AA1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ALA2))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ANIMAL2))).toBe(false);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ characters: [ID, AA1] });
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.power(g.find('p1', 'characters', AA1))).toBe(3000);
  });

  it("an opponent's {Animal}{Alabasta} Character is not a candidate", () => {
    const g = mk({ characters: [ID] }, { characters: [AA1] });
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p2', 'characters', AA1))).toBe(false);
  });
});
