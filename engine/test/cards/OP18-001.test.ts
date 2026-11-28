/** OP18-001 Karoo (Leader). */
import { describe, expect, it } from 'vitest';
import { hand } from './helpers.ts';
import { koByEffect } from './helpers-op14g4.ts';
import { AA1, ALA2, ALA5, ANIMAL2, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-001';
const has = (g: ReturnType<typeof mk>, id: string, kw: string) =>
  g.card(id).keywords.includes(kw as never);

describe('OP18-001 Karoo (Leader)', () => {
  it('your {Animal}{Alabasta} Characters gain [Rush] and +1000 power', () => {
    const g = mk({ leader: ID, characters: [AA1] });
    const id = g.find('p1', 'characters', AA1);
    expect(g.power(id)).toBe(4000);
    expect(has(g, id, 'Rush')).toBe(true);
  });

  it('a Character with only one of the two types is not affected', () => {
    const g = mk({ leader: ID, characters: [ALA2, ANIMAL2] });
    for (const card of [ALA2, ANIMAL2]) {
      const id = g.find('p1', 'characters', card);
      expect(g.power(id)).toBe(4000);
      expect(has(g, id, 'Rush')).toBe(false);
    }
  });

  it("an opponent's {Animal}{Alabasta} Character is not affected", () => {
    const g = mk({ leader: ID }, { characters: [AA1] });
    const id = g.find('p2', 'characters', AA1);
    expect(g.power(id)).toBe(3000);
    expect(has(g, id, 'Rush')).toBe(false);
  });

  it("when your {Alabasta} Character is K.O.'d, draw 1 card", () => {
    const g = mk({ leader: ID, characters: [ALA2] });
    koByEffect(g, 'p1', ALA2);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('[Once Per Turn]: a second {Alabasta} K.O. in the same turn draws nothing', () => {
    const g = mk({ leader: ID, characters: [ALA2, ALA5] });
    koByEffect(g, 'p1', ALA2);
    koByEffect(g, 'p1', ALA5);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("a K.O. of a non-{Alabasta} Character or of the opponent's {Alabasta} Character draws nothing", () => {
    const g = mk({ leader: ID, characters: [ANIMAL2] }, { characters: [ALA2] });
    koByEffect(g, 'p1', ANIMAL2);
    koByEffect(g, 'p2', ALA2);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
