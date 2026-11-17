/**
 * OP15-108 Nami (Character, Yellow, cost 1, 2000, Counter +2000, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Sky Island} type
 * card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-2, CR 8-4-4-1.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { BLUE, checkLook, describeLookAdd, hand, mine, playCard, SC, YL } from './kit-a.ts';

describeLookAdd({
  id: 'OP15-108',
  title: 'Nami',
  n: 3,
  match: [SC.genbo, SC.holly],
  miss: BLUE,
  beyond: SC.nola,
});

describe('OP15-108 Nami: filter details', () => {
  it('{Straw Hat Crew} alone does not qualify; the Leader type is irrelevant', () => {
    const g = mine(YL.shc, {
      hand: ['OP15-108'],
      deck: ['ST09-011', SC.kalgara6, BLUE, ...fill(BLUE, 10)],
    });
    playCard(g, 'OP15-108');
    // ST09-011 Luffy is {Land of Wano}/{Straw Hat Crew}: not Sky Island. Kalgara (OP08-099) is.
    checkLook(g, { candidates: [SC.kalgara6], pick: [SC.kalgara6] });
    expect(hand(g)).toEqual([SC.kalgara6]);
  });
});
