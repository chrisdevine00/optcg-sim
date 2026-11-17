/**
 * OP05-117 Upper Yard (Stage, Yellow, cost 1, {Sky Island}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Sky Island] type
 * card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Reading: the older template writes the type in square brackets; read as the type {Sky Island}
 * (CR 2-4-3), the same as the newer cards.
 * Rules: CR 8-4-4-2 (may find nothing), CR 8-4-4-1 ("up to" allows 0), CR 2-7-4 (playing a Stage).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { BLUE, chars, checkLook, describeLookAdd, mine, playCard, SC, YL } from './kit-a.ts';

describeLookAdd({
  id: 'OP05-117',
  title: 'Upper Yard',
  n: 5,
  match: [SC.genbo, SC.holly],
  miss: BLUE,
  beyond: SC.nola,
});

describe('OP05-117 Upper Yard: placement', () => {
  it('the Stage enters the Stage area and not the Character area', () => {
    const g = mine(YL.sky, { hand: ['OP05-117'], deck: fill(BLUE, 15) });
    playCard(g, 'OP05-117');
    checkLook(g, { candidates: [], pick: [] });
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual(['OP05-117']);
    expect(chars(g)).toEqual([]);
  });
});
