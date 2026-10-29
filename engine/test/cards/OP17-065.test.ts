/** OP17-065 Queen: [Banish]; [On Play] DON!! −1: draw 1 and up to 2 cost 5 or less cannot attack. */
import { describe, expect, it } from 'vitest';
import { accept, game, hand, KAIDO, payDon, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

describe('OP17-065 Queen', () => {
  it('draws 1 and stops up to 2 cost 5 or less Characters attacking', () => {
    const g = game(
      {
        leader: KAIDO,
        hand: ['OP17-065'],
        deck: [PURPLE, PURPLE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c5, V.c6] },
    );
    play(g, 'OP17-065');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    pick(g, [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).cannotAttack).toBe(true);
    expect(g.card(g.find('p1', 'characters', 'OP17-065')).keywords).toContain('Banish');
  });
});
