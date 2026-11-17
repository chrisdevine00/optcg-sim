/** OP17-087 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-087 Nico Robin', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-087', (g, id) => g.power(id), 2000, 5000);
  });

  const setup = (chars: string[], opp: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-087'],
        characters: chars,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play]: with a cost 12+ Character, up to 1 opponent's Character gets -3000 power this turn", () => {
    const g = setup([GIANT], [V.c3, PURPLE]);
    play(g, 'OP17-087');
    // Only the opponent's Characters are offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    const t = g.find('p2', 'characters', V.c3);
    pick(g, [t]);
    expect(g.power(t)).toBe(2000);
    expect(g.power(g.find('p2', 'characters', PURPLE))).toBe(3000);
    g.act({ type: 'endTurn' });
    expect(g.power(t)).toBe(5000);
  });

  it('[On Play]: "up to 1" may be declined', () => {
    const g = setup([GIANT], [V.c3]);
    play(g, 'OP17-087');
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('[On Play]: without a cost 12+ Character nothing happens (Robin itself is cost 2)', () => {
    const g = setup([], [V.c3]);
    play(g, 'OP17-087');
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it("[On Play]: an opponent's cost 12+ Character satisfies the condition too", () => {
    const g = setup([], [GIANT, V.c3]);
    play(g, 'OP17-087');
    expectDecision(g, 'choose', 'p1');
  });
});
