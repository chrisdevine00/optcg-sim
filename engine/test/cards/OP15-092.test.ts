/** OP15-092 Monkey.D.Luffy: trash-count tiers (cumulative). CR 4-9-2-1 (highest base power applies). */
import { describe, expect, it } from 'vitest';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, times } from './helpers.ts';

const LUFFY = 'OP15-092';

describe('OP15-092 Monkey.D.Luffy', () => {
  const at = (trash: number, opp = false, don = 0) =>
    game(
      { leader: PLAIN_PURPLE, characters: [{ card: LUFFY, don }], trash: times(trash, BLUE) },
      { leader: PLAIN_BLUE },
      opp ? { turn: 4, activePlayer: 'p2' } : {},
    );
  const luffy = (g: ReturnType<typeof at>) => g.find('p1', 'characters', LUFFY);

  it('with fewer than 10 cards in the trash it is a plain 7000 power, cost 7 Character', () => {
    const g = at(9);
    expect(g.power(luffy(g))).toBe(7000);
    expect(g.card(luffy(g)).cost).toBe(7);
  });

  it('10 or more cards: its base power becomes 9000 and it gains +10 cost', () => {
    const g = at(10);
    expect(g.power(luffy(g))).toBe(9000);
    expect(g.card(luffy(g)).cost).toBe(17);
  });

  it('a given DON!! adds its +1000 on top of the new base power on your turn', () => {
    const g = at(10, false, 1);
    expect(g.power(luffy(g))).toBe(10000);
  });

  it("20 or more cards: during your opponent's turn your Leader's base power becomes 7000", () => {
    const theirs = at(20, true);
    expect(theirs.power(theirs.leader('p1'))).toBe(7000);
    // On your own turn the Leader is unchanged.
    const mine = at(20);
    expect(mine.power(mine.leader('p1'))).toBe(5000);
    // 19 cards: no change either turn.
    const nineteen = at(19, true);
    expect(nineteen.power(nineteen.leader('p1'))).toBe(5000);
  });

  it('20 cards keeps the 10-card effects too (cumulative): 9000 power, cost 17', () => {
    const g = at(20);
    expect(g.power(luffy(g))).toBe(9000);
    expect(g.card(luffy(g)).cost).toBe(17);
  });

  it('30 or more cards: +1000 power on top of everything (all three apply)', () => {
    const g = at(30, true);
    expect(g.power(luffy(g))).toBe(10000);
    expect(g.card(luffy(g)).cost).toBe(17);
    expect(g.power(g.leader('p1'))).toBe(7000);
    const own = at(30);
    expect(own.power(luffy(own))).toBe(10000);
    expect(own.power(own.leader('p1'))).toBe(5000);
  });

  it('29 cards has no +1000', () => {
    const g = at(29);
    expect(g.power(luffy(g))).toBe(9000);
  });

  it("only the controller's trash is counted", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [LUFFY], trash: times(9, BLUE) },
      { leader: PLAIN_BLUE, trash: times(30, BLUE) },
    );
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(7000);
  });
});
