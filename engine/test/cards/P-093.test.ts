/** P-093 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { don, game, play, PLAIN_BLUE } from './helpers.ts';
import { ROSI } from './helpers-hancock-rosi.ts';

describe('P-093 Trafalgar Law', () => {
  const start = (mine: number, theirs: number) => {
    const g = game(
      { leader: ROSI, hand: ['P-093'], costArea: { active: mine, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: theirs, rested: 0 } },
    );
    play(g, 'P-093');
    return g;
  };

  it('has [Blocker]', () => {
    const g = start(4, 0);
    expect(g.card(g.find('p1', 'characters', 'P-093')).keywords).toContain('Blocker');
  });

  it('[On Play] adds 1 rested DON!! when you have fewer DON!! on your field than your opponent', () => {
    // 4 DON!! paid for the card, so 4 rested remain on my field against 6.
    const g = start(4, 6);
    expect(don(g, 'p1').deck).toBe(5);
    expect(don(g, 'p1').rested).toBe(5);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('adds when the counts are equal', () => {
    const g = start(4, 4);
    expect(don(g, 'p1').deck).toBe(5);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('adds nothing when you have more DON!! than your opponent', () => {
    const g = start(4, 3);
    expect(don(g, 'p1').deck).toBe(6);
    expect(don(g, 'p1').rested).toBe(4);
  });
});
