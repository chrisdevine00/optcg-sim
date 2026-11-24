/** OP16-010 Namule. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, idsIn, offers, P2000_A, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-010';

describe('OP16-010 Namule', () => {
  const start = (handCards: string[]) =>
    game(
      { leader: RED_LEADER, hand: [ID, ...handCards], costArea: { active: 1, rested: 0 } },
      // 2000 base power; 3000 base power; 7000 base power with 2 DON!! (9000 on its own turn only).
      { leader: PLAIN_BLUE, characters: [P2000_A, V.c1, { card: V.c5, don: 2 }] },
    );

  it("[On Play]: reveal a Character card with 8000 power: K.O. up to 1 of your opponent's Characters with 2000 base power or less", () => {
    const g = start([WB8]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WB8)]);
    expect(offers(g, g.find('p2', 'characters', P2000_A))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', V.c1))).toBe(false);
    expect(offers(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', P2000_A)]);
    expect(idsIn(g, 'p2', 'trash')).toEqual([P2000_A]);
    expect(hand(g, 'p1')).toEqual([WB8]);
  });

  it('"up to 1": nothing needs to be K.O.d', () => {
    const g = start([WB8]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WB8)]);
    none(g);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('cannot be paid with a 7000 power Character', () => {
    const g = start([WB7]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });

  it('declining K.O.s nothing', () => {
    const g = start([WB8]);
    play(g, ID);
    decline(g);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(3);
  });
});
