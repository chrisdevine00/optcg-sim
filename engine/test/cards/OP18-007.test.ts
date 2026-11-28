/** OP18-007 Smoker. */
import { describe, expect, it } from 'vitest';
import { mk, NAVY_L, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-007';
const read = (g: ReturnType<typeof mk>) => {
  const id = g.find('p1', 'characters', ID);
  return { power: g.power(id), banish: g.card(id).keywords.includes('Banish' as never) };
};

describe('OP18-007 Smoker', () => {
  it('with a {Navy} Leader it gains [Banish] and +1000 power', () => {
    expect(read(mk({ leader: NAVY_L, characters: [ID] }))).toEqual({ power: 6000, banish: true });
  });

  it('with another Leader it is a plain 5000-power Character', () => {
    expect(read(mk({ leader: PLAIN_PURPLE, characters: [ID] }))).toEqual({
      power: 5000,
      banish: false,
    });
  });

  it("the opponent's Leader type is not read", () => {
    expect(read(mk({ characters: [ID] }, { leader: NAVY_L }))).toEqual({
      power: 5000,
      banish: false,
    });
  });
});
