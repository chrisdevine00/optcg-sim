/** OP14-107 Shakuyaku. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { damageGame, HANCOCK, ROSI } from './helpers-hancock-rosi.ts';

describe('OP14-107 Shakuyaku', () => {
  const start = (oppLife: number) => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP14-107', V.c1, V.c2],
        deck: [BLUE, BLUE, BLUE],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE, life: Array.from({ length: oppLife }, () => PURPLE) },
    );
    play(g, 'OP14-107');
    return g;
  };

  it('[On Play] with 3 or less opponent Life: draws 2, then trashes 2 cards from hand', () => {
    const g = start(3);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', BLUE, 0)]);
    expect(hand(g, 'p1').sort()).toEqual([V.c2, BLUE].sort());
    expect(trash(g, 'p1').sort()).toEqual([V.c1, BLUE].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('does nothing with 4 opponent Life cards (neither the draw nor the trash)', () => {
    const g = start(4);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expectDecision(g, 'main', 'p1');
  });

  it('applies at 0 opponent Life', () => {
    const g = start(0);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
    expectDecision(g, 'choose', 'p1');
  });

  it('[Trigger] with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageGame('OP14-107', { leader: HANCOCK });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-107']);
  });

  it('[Trigger] with another Leader does not play it', () => {
    const g = damageGame('OP14-107', { leader: ROSI });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
