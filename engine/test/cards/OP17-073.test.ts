/** OP17-073 Basil Hawkins. */
import { describe, expect, it } from 'vitest';
import { accept, don, game, KAIDO, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';

describe('OP17-073 Basil Hawkins', () => {
  it('trash 1 card from hand: add 1 active DON!!', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-073', PURPLE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-073');
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 6 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([PURPLE]);
  });
});
