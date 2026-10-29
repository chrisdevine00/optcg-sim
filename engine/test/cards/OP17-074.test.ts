/** OP17-074 Yamato: [Blocker]; [On Play] add 1 rested DON!!. */
import { describe, expect, it } from 'vitest';
import { don, game, KAIDO, play, PLAIN_BLUE } from './helpers.ts';

describe('OP17-074 Yamato', () => {
  it('adds 1 rested DON!! and has [Blocker]', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-074'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-074');
    expect(don(g, 'p1')).toMatchObject({ rested: 4, deck: 6 });
    expect(g.card(g.find('p1', 'characters', 'OP17-074')).keywords).toContain('Blocker');
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-074'], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-074');
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });
});
