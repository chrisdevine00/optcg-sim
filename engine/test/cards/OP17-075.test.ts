/** OP17-075 X.Drake. QA-OP17 OP17-075: chosen face-down by the player who activated it. */
import { describe, expect, it } from 'vitest';
import { accept, game, KAIDO, payDon, play, PLAIN_BLUE, V } from './helpers.ts';

describe('OP17-075 X.Drake', () => {
  it("DON!! −2: 1 card from the opponent's hand is trashed, picked blind (no choice is shown)", () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-075'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, hand: [V.c1, V.c2, V.c3] },
    );
    play(g, 'OP17-075');
    accept(g);
    payDon(g);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
