/** OP18-053 Mr.7 & Miss.Father'sDay. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, option, play } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { orderAll } from './helpers-w3s.ts';
import { PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-053';
const start = () => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5],
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe("OP18-053 Mr.7 & Miss.Father'sDay", () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000); // 3000 + 1000 DON!! + 1000
  });

  it('[On Play] looks at 3: all go to the top or all to the bottom, in the chosen order', () => {
    const g = start();
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'bottom');
    orderAll(g);
    expect(cardsOf(g, 'p1', 'deck').slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(cardsOf(g, 'p1', 'deck').slice(2).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('top: the 3 cards stay on top in the order chosen', () => {
    const g = start();
    option(g, 'top');
    orderAll(g);
    expect(cardsOf(g, 'p1', 'deck').slice(0, 3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(cardsOf(g, 'p1', 'deck').slice(3)).toEqual([V.c4, V.c5]);
  });

  it('nothing is drawn or added to the hand', () => {
    const g = start();
    option(g, 'top');
    orderAll(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
