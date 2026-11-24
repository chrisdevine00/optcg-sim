/** OP16-009 Speed Jil. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { canAccept, offers, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-009';

describe('OP16-009 Speed Jil', () => {
  const start = (handCards: string[]) =>
    game(
      { leader: RED_LEADER, hand: [ID, ...handCards], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it("[On Play]: trash a Character card with 8000 power from your hand: gains [Rush] and +2000 power until the end of your opponent's next End Phase", () => {
    const g = start([WB8, V.c1]);
    const jil = play(g, ID);
    accept(g);
    expect(offers(g, g.find('p1', 'hand', WB8))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', WB8)]);
    expect(trash(g, 'p1')).toEqual([WB8]);
    expect(g.card(jil).keywords).toContain('Rush');
    expect(g.power(jil)).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.card(jil).keywords).toContain('Rush');
    expect(g.power(jil)).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.card(jil).keywords).not.toContain('Rush');
    expect(g.power(jil)).toBe(5000);
  });

  it('cannot be paid with a 7000 power Character', () => {
    const g = start([WB7]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });

  it('declining keeps the hand and gives no Rush or power', () => {
    const g = start([WB8]);
    const jil = play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([WB8]);
    expect(g.card(jil).keywords).not.toContain('Rush');
    expect(g.power(jil)).toBe(5000);
  });
});
