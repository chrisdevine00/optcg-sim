/** OP17-052 Don Marlon: add up to 1 blue Event with a cost of 0 from your trash to your hand. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_PURPLE, ROCKS } from './helpers.ts';

describe('OP17-052 Don Marlon', () => {
  it('offers only blue cost-0 Events in the trash', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-052'],
        trash: ['OP17-055', 'OP17-045', 'OP07-077'],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP17-052');
    expectDecision(g, 'choose', 'p1');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', 'OP17-055')]);
    expect(hand(g, 'p1')).toEqual(['OP17-055']);
  });
});
