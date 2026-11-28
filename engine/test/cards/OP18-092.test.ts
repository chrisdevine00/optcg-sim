/** OP18-092 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { expectBigCondition } from './helpers-sabo.ts';

const ID = 'OP18-092';
const rush = (trashCards: string[], turnPlayed = false) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [ID],
      trash: trashCards,
    },
    { leader: PLAIN_BLUE },
  );
  void turnPlayed;
  return g.card(g.find('p1', 'characters', ID)).keywords.includes('Rush');
};
const fill = (n: number) => Array.from({ length: n }, () => V.c1);

describe('OP18-092 Roronoa Zoro', () => {
  it('+3000 power while any Character with a cost of 12 or more exists (either side)', () => {
    expectBigCondition(ID, (g, id) => g.power(id), 2000, 5000);
  });

  it('gains [Rush] with 10 or more cards in your trash', () => {
    expect(rush(fill(10))).toBe(true);
    expect(rush(fill(14))).toBe(true);
  });

  it('9 cards in your trash is not enough; the opponent trash does not count', () => {
    expect(rush(fill(9))).toBe(false);
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID], trash: fill(9) },
      { leader: PLAIN_BLUE, trash: fill(5) },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('the two lines are independent: Rush does not need the big Character', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID], trash: fill(10) },
      { leader: PLAIN_BLUE },
    );
    const id = g.find('p1', 'characters', ID);
    expect(g.power(id)).toBe(2000);
    expect(g.card(id).keywords).toContain('Rush');
  });
});
