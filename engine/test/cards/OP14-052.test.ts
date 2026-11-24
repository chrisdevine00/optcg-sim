/** OP14-052 Hannyabal. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { canAccept, canPick, FM_LEADER, ID4, ID6, mine } from './helpers-op14g2.ts';

const ID = 'OP14-052';

const start = (handCards: string[]) =>
  mine(FM_LEADER, { hand: [ID, ...handCards], costArea: { active: 5, rested: 0 } });

describe('OP14-052 Hannyabal', () => {
  it('[On Play]: trash 3 cards from hand: plays an {Impel Down} Character with cost 6 or less from hand', () => {
    const g = start([BLUE, BLUE, BLUE, ID6, ID4]);
    play(g, ID);
    accept(g);
    pick(g, [
      g.find('p1', 'hand', BLUE, 0),
      g.find('p1', 'hand', BLUE, 1),
      g.find('p1', 'hand', BLUE, 2),
    ]);
    expect(trash(g, 'p1')).toEqual([BLUE, BLUE, BLUE]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', ID6))).toBe(true); // cost 6: boundary in
    pick(g, [g.find('p1', 'hand', ID6)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([ID, ID6].sort());
    expect(hand(g, 'p1')).toEqual([ID4]);
  });

  it('only {Impel Down} Characters qualify (not other types)', () => {
    const g = start([BLUE, BLUE, BLUE, V.c3, ID4]);
    play(g, ID);
    accept(g);
    pick(g, [
      g.find('p1', 'hand', BLUE, 0),
      g.find('p1', 'hand', BLUE, 1),
      g.find('p1', 'hand', BLUE, 2),
    ]);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', ID4))).toBe(true);
  });

  it('declining the cost trashes nothing and plays nothing', () => {
    const g = start([BLUE, BLUE, BLUE, ID4]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with fewer than 3 cards in hand the cost cannot be paid', () => {
    const g = start([BLUE, ID4]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });
});
