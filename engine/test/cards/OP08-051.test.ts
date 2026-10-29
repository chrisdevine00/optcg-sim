/** OP08-051 Buckin: [Your Turn] [On Play] up to 1 of your [Edward Weevil] cards gains +2000. */
import { describe, expect, it } from 'vitest';
import { game, pick, play, PLAIN_PURPLE, ROCKS } from './helpers.ts';

describe('OP08-051 Buckin', () => {
  it('gives your Edward Weevil +2000 during this turn', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP08-051'],
        characters: ['OP08-042'],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    const weevil = g.find('p1', 'characters', 'OP08-042');
    play(g, 'OP08-051');
    pick(g, [weevil]);
    expect(g.power(weevil)).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(weevil)).toBe(5000);
  });

  it('offers only cards named Edward Weevil', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP08-051'],
        characters: ['OP17-040'],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP08-051');
    // No Edward Weevil on the field: no choice at all, straight back to Main.
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
