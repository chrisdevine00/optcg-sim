/** OP17-060 Ulti & Page One. */
import { describe, expect, it } from 'vitest';
import { don, game, KAIDO, pick, play, PLAIN_BLUE, V } from './helpers.ts';

describe('OP17-060 Ulti & Page One', () => {
  it('adds 1 active DON!!, then K.O.s a 3000-or-less Character', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-060'], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2] },
    );
    play(g, 'OP17-060');
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 3 });
    expect(
      g.isLegal({ type: 'pick', choice: g.find('p2', 'characters', V.c2), player: 'p1' }),
    ).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
  });

  it('without an Animal Kingdom Pirates Leader nothing happens', () => {
    const g = game(
      { leader: 'OP12-061', hand: ['OP17-060'], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, 'OP17-060');
    expect(don(g, 'p1').deck).toBe(4);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
