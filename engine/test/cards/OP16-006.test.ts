/** OP16-006 Shanks. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, idsIn, offers, RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-006';

describe('OP16-006 Shanks', () => {
  const start = (active = 6) =>
    game(
      { leader: RED_LEADER, hand: [ID], costArea: { active, rested: 0 } },
      // 4000 power (cost 2), 5000 power (cost 3).
      { leader: PLAIN_BLUE, characters: [V.c2, V.c3] },
    );

  it("[On Play]: rest 2 DON!!: K.O. up to 1 of your opponent's Characters with 4000 power or less", () => {
    const g = start();
    play(g, ID);
    accept(g);
    // 4000 is on the line (inclusive); 5000 is not.
    expect(offers(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(idsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(idsIn(g, 'p2', 'trash')).toEqual([V.c2]);
    // 4 for Shanks plus 2 rested: 6 DON!! rested in all.
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('"up to 1": the K.O. may be skipped, but the 2 DON!! are already rested', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('declining rests nothing and K.O.s nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('cannot be paid with fewer than 2 active DON!! left after the play', () => {
    const g = start(5);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });
});
