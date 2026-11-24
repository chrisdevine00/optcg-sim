/** OP15-051 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE } from './helpers.ts';
import { DRESSROSA_LEADER, LUCY, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-051';

describe('OP15-051 Monkey.D.Luffy', () => {
  const board = (leader: string, turn: number, who: 'p1' | 'p2') =>
    game({ leader, characters: [ID] }, { leader: PLAIN_BLUE }, { turn, activePlayer: who });
  const power = (g: ReturnType<typeof board>) => g.power(g.find('p1', 'characters', ID));

  it("[Opponent's Turn] with a {Dressrosa} Leader it gains +3000 (4000 to 7000)", () => {
    expect(power(board(DRESSROSA_LEADER, 4, 'p2'))).toBe(7000);
    expect(power(board(LUCY, 4, 'p2'))).toBe(7000);
  });

  it('on your own turn it stays at 4000', () => {
    expect(power(board(DRESSROSA_LEADER, 3, 'p1'))).toBe(4000);
  });

  it('without a {Dressrosa} Leader it stays at 4000 on the opponent turn', () => {
    expect(power(board(OTHER_LEADER, 4, 'p2'))).toBe(4000);
  });
});
