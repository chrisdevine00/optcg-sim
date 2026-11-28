/** OP18-055 Mr.9 & Ms. Wednesday. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, play } from './helpers.ts';
import { candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-055';
const start = (theirs: string[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: theirs },
  );
  play(g, ID);
  return g;
};

describe('OP18-055 Mr.9 & Ms. Wednesday', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000); // 4000 + 1000 DON!! + 1000
  });

  it("[On Play] returns an opponent Character with a cost of 2 or less to its owner's hand", () => {
    const g = start([V.c2, V.c3, V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c2), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(hand(g, 'p2')).toEqual([V.c2]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c3, V.c1]);
  });

  it('a cost 3 Character is not offered', () => {
    const g = start([V.c3]);
    expect(candidates(g)).toEqual([]);
  });

  it('"up to 1": may return nothing', () => {
    const g = start([V.c1]);
    none(g);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('only the opponent Characters: your own cost 2 Character is not offered', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], characters: [V.c2], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c1)]);
  });
});
