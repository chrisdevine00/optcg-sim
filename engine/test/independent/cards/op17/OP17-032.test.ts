/**
 * OP17-032 Limejuice (Character, Green, cost 1, 2000, Counter +2000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 card with a type
 * including "Red-Haired Pirates" and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order."
 *
 * Rules: CR 11-2-1 (revealing), CR 11-3 (looking), CR 8-4-4-1/-2 ("up to", hidden picks may be
 * none), CR 2-4-3-1 (type including), CR 3-1-7 (order of cards entering an area).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deck,
  describeLook,
  hand,
  kind,
  LD,
  mine,
  need,
  none,
  playCard,
  don,
  fill,
  BLUE,
  settleOrders,
} from './kit-op17b.ts';

const LIME = 'OP17-032';

describeLook({
  id: LIME,
  n: 3,
  start: (cards) => {
    const g = mine(LD.neutral, { hand: [LIME], deck: cards });
    playCard(g, LIME);
    return g;
  },
  match: ['OP09-006', 'OP09-016'],
  substr: 'OP17-026',
  miss: BLUE,
});

describe('OP17-032 Limejuice: further checks', () => {
  it('costs 1: playing it rests exactly 1 DON!!', () => {
    const g = mine(LD.neutral, { hand: [LIME], deck: fill(BLUE, 15) });
    playCard(g, LIME);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('the first prompt is the candidate choice itself (no extra "may" question), and nothing is drawn', () => {
    const g = mine(LD.neutral, { hand: [LIME], deck: ['OP09-006', ...fill(BLUE, 14)] });
    playCard(g, LIME);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
  });

  it('with only 2 cards left in the deck it looks at those 2 and puts the rest back (no deck-out)', () => {
    const g = mine(LD.neutral, { hand: [LIME], deck: ['OP09-006', BLUE] });
    playCard(g, LIME);
    if (kind(g) === 'choose') none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(2);
  });
});
