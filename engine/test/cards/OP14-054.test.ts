/** OP14-054 Fisher Tiger. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { FM_LEADER, mine, OTHER_LEADER, fill } from './helpers-op14g2.ts';

const ID = 'OP14-054';

describe('OP14-054 Fisher Tiger', () => {
  it('[On Play]: with a {Fish-Man} Leader, draws 3 cards', () => {
    const g = mine(FM_LEADER, { hand: [ID], costArea: { active: 6, rested: 0 } });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('[On Play]: without a {Fish-Man} Leader, draws nothing', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], costArea: { active: 6, rested: 0 } });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('[End of Your Turn]: with 7 cards in hand, trashes cards one at a time until 5 remain', () => {
    const g = mine(FM_LEADER, { characters: [ID], hand: [V.c1, V.c2, V.c3, ...fill(4, BLUE)] });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(dec(g)?.player).not.toBe('p1');
  });

  it('[End of Your Turn]: exactly 5 cards in hand: nothing is trashed (boundary)', () => {
    const g = mine(FM_LEADER, { characters: [ID], hand: fill(5, BLUE) });
    g.act({ type: 'endTurn' });
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('[End of Your Turn]: 6 cards in hand: exactly 1 is trashed', () => {
    const g = mine(FM_LEADER, { characters: [ID], hand: fill(6, BLUE) });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it('[End of Your Turn]: with fewer than 5 cards in hand nothing happens and nothing is asked', () => {
    const g = mine(FM_LEADER, { characters: [ID], hand: fill(2, BLUE) });
    g.act({ type: 'endTurn' });
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
