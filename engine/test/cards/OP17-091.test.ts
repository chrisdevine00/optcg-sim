/** OP17-091 Brook. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
} from './helpers.ts';
import { expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-091 Brook', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-091', (g, id) => g.power(id), 2000, 5000);
  });

  const setup = (chars: string[], oppHand: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-091'],
        characters: chars,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE, hand: oppHand },
    );

  it('[On Play]: with a cost 12+ Character, your opponent trashes 1 card from their hand (their choice)', () => {
    const g = setup([GIANT], [BLUE, PURPLE]);
    play(g, 'OP17-091');
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', PURPLE)]);
    expect(trash(g, 'p2')).toEqual([PURPLE]);
    expect(hand(g, 'p2')).toEqual([BLUE]);
  });

  it('[On Play]: with an empty opponent hand nothing happens', () => {
    const g = setup([GIANT], []);
    play(g, 'OP17-091');
    // The engine still asks the opponent (a choice of 0 cards), so an empty hand is not revealed.
    expect(expectDecision(g, 'choose', 'p2').max).toBe(0);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play]: without a cost 12+ Character nothing is trashed', () => {
    const g = setup([], [BLUE]);
    play(g, 'OP17-091');
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toEqual([BLUE]);
  });

  it("[On Play]: an opponent's cost 12+ Character satisfies the condition", () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: ['OP17-091'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, hand: [BLUE], characters: [GIANT] },
    );
    play(g, 'OP17-091');
    // One card in hand: the choice is forced or auto-resolved; either way it ends up trashed.
    if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(trash(g, 'p2')).toEqual([BLUE]);
  });
});
