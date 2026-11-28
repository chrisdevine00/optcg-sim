/** OP18-006 Koza. */
import { describe, expect, it } from 'vitest';
import { ALA1, ALA2, mk, PLAIN_PURPLE, VIVI_L } from './helpers-op18-g1.ts';

const ID = 'OP18-006';
const read = (g: ReturnType<typeof mk>) => {
  const id = g.find('p1', 'characters', ID);
  return { power: g.power(id), rush: g.card(id).keywords.includes('Rush' as never) };
};

describe('OP18-006 Koza', () => {
  it('with a [Nefeltari Vivi] Character it gains [Rush] and +1000 power', () => {
    expect(read(mk({ characters: [ID, ALA2] }))).toEqual({ power: 5000, rush: true });
  });

  it('a [Nefeltari Vivi] Leader counts as well (Q2 reading)', () => {
    expect(read(mk({ leader: VIVI_L, characters: [ID] }))).toEqual({ power: 5000, rush: true });
  });

  it('without [Nefeltari Vivi] it is a plain 4000-power Character', () => {
    expect(read(mk({ leader: PLAIN_PURPLE, characters: [ID, ALA1] }))).toEqual({
      power: 4000,
      rush: false,
    });
  });

  it("your opponent's [Nefeltari Vivi] does not count", () => {
    expect(read(mk({ characters: [ID] }, { characters: [ALA2] }))).toEqual({
      power: 4000,
      rush: false,
    });
  });
});
