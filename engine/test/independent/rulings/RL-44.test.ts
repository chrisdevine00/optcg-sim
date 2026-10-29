/**
 * RL-44 OP17-039 Rocks.D.Xebec: the revealed card (QA-OP17 OP17-039).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { accept, BLUE, game, hand, pick, PLAIN_PURPLE, ROCKS } from '../../cards/helpers.ts';

describe('RL-44: OP17-039 Rocks.D.Xebec: the revealed card', () => {
  it('RL-44 (QA-OP17 OP17-039): the revealed card stays on top; a hit draws it', () => {
    const g = game(
      { leader: ROCKS, hand: [BLUE], deck: ['OP17-045', BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toContain('OP17-045');
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('RL-44: on a miss both players know the top card until the next shuffle', () => {
    const g = game(
      { leader: ROCKS, hand: [BLUE], deck: [BLUE, 'OP17-045'] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    for (const p of ['p1', 'p2'] as const) {
      const v = project(g.state, p) as unknown as { known: Record<string, string> };
      expect(v.known['p1.deck.0']).toBe(BLUE);
    }
  });
});
