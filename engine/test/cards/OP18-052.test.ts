/** OP18-052 Mr.5 & Miss.Valentine. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play } from './helpers.ts';
import { BW2, BW4, candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-052';
const start = (hand: string[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID, ...hand], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe('OP18-052 Mr.5 & Miss.Valentine', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000); // 4000 + 1000 DON!! + 1000
  });

  it('[On Play] plays a {Baroque Works} Character with a cost of 3 or less from your hand', () => {
    const g = start([BW2, BW4, V.c2]);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', BW2)]);
    pick(g, [g.find('p1', 'hand', BW2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, BW2]);
  });

  it('a cost 4 {Baroque Works} Character is not offered', () => {
    const g = start([BW4]);
    expect(candidates(g)).toEqual([]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([BW2]);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
