/** OP16-054 Mr.1(Daz.Bonez) (Blue, cost 2, 2000). */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, game, hand, play } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER, mine } from './helpers-op16g2.ts';

const ID = 'OP16-054';

describe('OP16-054 Mr.1(Daz.Bonez)', () => {
  const board = (
    don: number,
    cards: number,
    extra: { turn?: number; activePlayer?: 'p1' | 'p2' } = {},
  ) =>
    game(
      {
        leader: IMPEL_LEADER,
        characters: [{ card: ID, don }],
        hand: Array.from({ length: cards }, () => PURPLE),
      },
      { leader: BLUE_LEADER },
      extra,
    );
  const power = (g: ReturnType<typeof board>) => g.power(g.find('p1', 'characters', ID));

  it('[DON!! x1] [Your Turn] with 5 or more cards in hand: +3000 power', () => {
    expect(power(board(1, 5))).toBe(2000 + 1000 + 3000); // base, the given DON!!, the effect
  });

  it('with 4 cards in hand there is no bonus', () => {
    expect(power(board(1, 4))).toBe(2000 + 1000);
  });

  it('without a DON!! given there is no bonus', () => {
    expect(power(board(0, 7))).toBe(2000);
  });

  it("not on the opponent's turn", () => {
    expect(power(board(1, 7, { turn: 4, activePlayer: 'p2' }))).toBe(2000);
  });

  it('[On Play] draws 1', () => {
    const g = mine({ hand: [ID], deck: [BLUE, BLUE] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
