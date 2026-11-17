/** OP17-113 Streusen: [On Play] look at 3, reveal up to 1 {Big Mom Pirates} card and add it to your hand. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { BMP, ENEL, ids, settleOrder, TRIG } from './helpers-robin.ts';

describe('OP17-113 Streusen', () => {
  it('[On Play] takes a {Big Mom Pirates} card from the top 3 and sends the rest to the bottom', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['OP17-113'],
        deck: [BLUE, BMP, TRIG, PURPLE, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-113');
    expectDecision(g, 'choose', 'p1');
    // Of BLUE, BMP, TRIG only the two {Big Mom Pirates} cards qualify; the 4th card is not seen.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', BMP)]);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([BMP]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([PURPLE, PURPLE]);
    expect([...deck.slice(2)].sort()).toEqual([BLUE, TRIG].sort());
  });

  it('"up to 1": may take nothing', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['OP17-113'],
        deck: [BLUE, BMP, TRIG, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-113');
    none(g);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')[0]).toBe(PURPLE);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  it('a {Big Mom Pirates} card outside the top 3 is not offered', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['OP17-113'],
        deck: [BLUE, PURPLE, BLUE, BMP],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-113');
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
