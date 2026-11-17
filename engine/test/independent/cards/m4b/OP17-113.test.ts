/**
 * OP17-113 Streusen (Character, Yellow, cost 1, 2000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Big Mom Pirates}
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-2 (a search of a secret area may find nothing, even if a match exists), CR 8-4-4-1
 * ("up to" allows 0), CR 3-1-7 (the owner orders cards placed together).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  checkLook,
  deck,
  hand,
  mine,
  playCard,
  SC,
  tail,
  YL,
  reachablePickSets,
} from './kit-a.ts';

const TOP3 = [SC.bobbin, BLUE, SC.anana];
const REST = [SC.opera, ...fill(BLUE, 9)];

function game(top: string[] = TOP3, leader: string = YL.neutral) {
  const g = mine(leader, { hand: ['OP17-113'], deck: [...top, ...REST] });
  playCard(g, 'OP17-113');
  return g;
}

describe('OP17-113 Streusen: [On Play] look at 3, add up to 1 {Big Mom Pirates}, rest to the bottom', () => {
  it('offers exactly the {Big Mom Pirates} cards among the top 3; the pick goes to hand, the rest to the bottom', () => {
    const g = game();
    checkLook(g, { candidates: [SC.bobbin, SC.anana], pick: [SC.anana] });
    expect(hand(g)).toEqual([SC.anana]);
    expect(deck(g)).toHaveLength(12);
    // The card below the looked-at three is now on top; the other two went to the bottom.
    expect(deck(g)[0]).toBe(SC.opera);
    expect(tail(deck(g), 2)).toEqual([SC.bobbin, BLUE].sort());
  });

  it('CR 8-4-4-2: may add nothing; all three go to the bottom', () => {
    const g = game();
    checkLook(g, { candidates: [SC.bobbin, SC.anana], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SC.opera);
    expect(tail(deck(g), 3)).toEqual([...TOP3].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = game();
    const adds = reachablePickSets(g);
    expect(adds.has('')).toBe(true);
    expect(adds.has(SC.bobbin)).toBe(true);
    expect(adds.has(SC.anana)).toBe(true);
    for (const a of adds) expect(a.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: a {Big Mom Pirates} card in 4th place is not offered', () => {
    const g = game([BLUE, BLUE, BLUE]);
    // REST starts with Charlotte Opera ({Big Mom Pirates}) in 4th place.
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SC.opera);
    expect(deck(g)).toHaveLength(13);
  });

  it('a card that is not {Big Mom Pirates} is never offered, whatever its other text', () => {
    const g = game([SC.speed, SC.genbo, SC.opera]);
    checkLook(g, { candidates: [SC.opera], pick: [] });
  });

  it('the Leader does not matter: a non-Big-Mom Leader still searches', () => {
    const g = game(TOP3, YL.sky);
    checkLook(g, { candidates: [SC.bobbin, SC.anana], pick: [SC.bobbin] });
    expect(hand(g)).toEqual([SC.bobbin]);
  });
});
