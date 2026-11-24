/** OP16-008 Squard. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { BIG10, canAccept, idsIn, offers, RED_LEADER, SHANKS_V, WB9 } from './helpers-op16g1.ts';

const ID = 'OP16-008';

describe('OP16-008 Squard', () => {
  const start = (mine: Parameters<typeof game>[0]['characters']) =>
    game(
      { leader: RED_LEADER, hand: [ID], characters: mine, costArea: { active: 5, rested: 0 } },
      // 8000 (cost 6) and 9000 (cost 7) power.
      { leader: PLAIN_BLUE, characters: [V.c6, V.c7] },
    );

  it("[On Play]: trash 1 of your Characters with 10000 base power: K.O. up to 1 of your opponent's Characters with 8000 power or less", () => {
    const g = start([BIG10, SHANKS_V, { card: WB9, don: 1 }]);
    play(g, ID);
    accept(g);
    // Only 10000 BASE power counts: the 9000 Character with a DON!! given (10000 now) and Squard itself cannot be trashed.
    expect(offers(g, g.find('p1', 'characters', BIG10))).toBe(true);
    expect(offers(g, g.find('p1', 'characters', SHANKS_V))).toBe(true);
    expect(offers(g, g.find('p1', 'characters', WB9))).toBe(false);
    expect(offers(g, g.find('p1', 'characters', ID))).toBe(false);
    pick(g, [g.find('p1', 'characters', BIG10)]);
    expect(idsIn(g, 'p1', 'trash')).toEqual([BIG10]);
    expect(offers(g, g.find('p2', 'characters', V.c6))).toBe(true); // 8000 is inclusive
    expect(offers(g, g.find('p2', 'characters', V.c7))).toBe(false); // 9000 is not
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(idsIn(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('the cost reads base power: a 9000 power Character with a DON!! given (10000 now) cannot pay it', () => {
    const g = start([{ card: WB9, don: 1 }]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });

  it('declining trashes nothing and K.O.s nothing', () => {
    const g = start([BIG10]);
    play(g, ID);
    decline(g);
    expect(idsIn(g, 'p1', 'characters')).toEqual([BIG10, ID]);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(2);
  });
});
