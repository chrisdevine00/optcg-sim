/** OP18-005 Kung Fu Jugon. */
import { describe, expect, it } from 'vitest';
import { mk } from './helpers-op18-g1.ts';

const ID = 'OP18-005';

describe('OP18-005 Kung Fu Jugon', () => {
  it('on your turn a lone Jugon counts itself: +1000', () => {
    const g = mk({ characters: [ID] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });

  it('each Jugon gets +1000 for every Jugon you have', () => {
    const g = mk({ characters: [ID, ID, ID] });
    expect(g.power(g.find('p1', 'characters', ID, 0))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', ID, 2))).toBe(3000);
  });

  it("not on your opponent's turn", () => {
    const g = mk({ characters: [ID, ID] }, {}, { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
  });

  it("your opponent's Jugon are not counted", () => {
    const g = mk({ characters: [ID] }, { characters: [ID, ID] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });
});
