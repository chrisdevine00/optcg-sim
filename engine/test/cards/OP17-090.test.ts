/** OP17-090 Franky. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-090 Franky', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-090', (g, id) => g.power(id), 2000, 5000);
  });

  const setup = (chars: string[], opp: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-090'],
        characters: chars,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play]: with a cost 12+ Character, K.O. up to 1 of the opponent's Characters with a cost of 2 or less", () => {
    const g = setup([GIANT], [V.c2, V.c3, V.c1]);
    play(g, 'OP17-090');
    // The cost 3 Character cannot be chosen.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('[On Play]: "up to 1" may be declined', () => {
    const g = setup([GIANT], [V.c2]);
    play(g, 'OP17-090');
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it("[On Play]: without a cost 12+ Character nothing is K.O.'d and nothing is asked", () => {
    const g = setup([], [V.c2]);
    play(g, 'OP17-090');
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it("[On Play]: an opponent's cost 12+ Character satisfies the condition", () => {
    const g = setup([], [GIANT, V.c2]);
    play(g, 'OP17-090');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(trash(g, 'p2')).toEqual([V.c2]);
  });
});
