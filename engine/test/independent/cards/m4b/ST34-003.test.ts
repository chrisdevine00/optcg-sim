/**
 * ST34-003 Charlotte Brulee (Character, Purple, cost 1, 2000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Big Mom Pirates}
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-2 (may find nothing in a secret area), CR 8-4-4-1 ("up to" allows 0).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { BLUE, checkLook, deck, describeLookAdd, hand, mine, playCard, SC, YL } from './kit-a.ts';

describeLookAdd({
  id: 'ST34-003',
  title: 'Charlotte Brulee',
  n: 3,
  match: [SC.bobbin, SC.anana],
  miss: BLUE,
  beyond: SC.opera,
});

describe('ST34-003 Charlotte Brulee: filter details', () => {
  it('only the type counts: Rabiyan ({Big Mom Pirates}) is offered, Speed and Genbo are not', () => {
    const g = mine(YL.neutral, {
      hand: ['ST34-003'],
      deck: [SC.genbo, SC.speed, SC.rabiyan, ...fill(BLUE, 10)],
    });
    playCard(g, 'ST34-003');
    checkLook(g, { candidates: [SC.rabiyan], pick: [SC.rabiyan] });
    expect(hand(g)).toEqual([SC.rabiyan]);
    expect(deck(g)).toHaveLength(12);
  });
});
