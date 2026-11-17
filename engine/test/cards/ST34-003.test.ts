/** ST34-003 Charlotte Brulee: [On Play] look at 3, reveal up to 1 {Big Mom Pirates} card and add it to your hand. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { BMP, BMP6, ENEL, ids, settleOrder } from './helpers-robin.ts';

describe('ST34-003 Charlotte Brulee', () => {
  it('[On Play] takes a {Big Mom Pirates} card from the top 3 and sends the other 2 to the bottom', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['ST34-003'],
        deck: [BMP6, BLUE, BMP, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'ST34-003');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', BMP6)]);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([BMP6]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck[0]).toBe(PURPLE);
    expect([...deck.slice(1)].sort()).toEqual([BLUE, BMP].sort());
  });

  it('with no {Big Mom Pirates} card in the top 3 nothing can be taken', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['ST34-003'],
        deck: [BLUE, PURPLE, BLUE, BMP],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'ST34-003');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
