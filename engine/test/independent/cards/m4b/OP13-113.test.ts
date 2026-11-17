/**
 * OP13-113 Lilith (Character, Yellow, cost 1, 2000, Counter +1000, {Scientist}/{Egghead}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 card with a
 * [Trigger] other than [Lilith] and add it to your hand. Then, place the rest at the bottom of your
 * deck in any order.
 * [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: CR 8-4-4-2 (may find nothing), CR 10-1-5 ([Trigger] resolves the effect, the card is then
 * trashed), CR 2-11-2 (a card "with a [Trigger]" has [Trigger] text), CR 2-1-2 ([Lilith] means the name).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  checkLook,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  mine,
  playCard,
  reachablePickSets,
  RED,
  SC,
  tail,
  theirs,
  trash,
  YL,
} from './kit-a.ts';

const EVENT_TRIG = 'OP07-077';
const TOP4 = [SC.speed, BLUE, 'OP13-113', EVENT_TRIG];
const REST = [SC.rabiyan, ...fill(BLUE, 8)];

function played(top = TOP4) {
  const g = mine(YL.neutral, { hand: ['OP13-113'], deck: [...top, ...REST] });
  playCard(g, 'OP13-113');
  return g;
}

describe('OP13-113 Lilith: [On Play] look at 4, add up to 1 card with a [Trigger] other than [Lilith]', () => {
  it('offers the cards with a [Trigger] (a Character and an Event) but not other Lilith nor cards without', () => {
    const g = played();
    checkLook(g, { candidates: [SC.speed, EVENT_TRIG], pick: [EVENT_TRIG] });
    expect(hand(g)).toEqual([EVENT_TRIG]);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(SC.rabiyan);
    expect(tail(deck(g), 3)).toEqual([SC.speed, BLUE, 'OP13-113'].sort());
  });

  it('may add nothing (CR 8-4-4-2)', () => {
    const g = played();
    checkLook(g, { candidates: [SC.speed, EVENT_TRIG], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 4)).toEqual([...TOP4].sort());
  });

  it('adds at most one card', () => {
    const sets = reachablePickSets(played());
    expect(sets.has(SC.speed)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 4 are looked at: a [Trigger] card in 5th place is not offered', () => {
    const g = played(fill(BLUE, 4));
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SC.rabiyan);
  });

  it('another [Lilith] alone is never a candidate', () => {
    const g = played(['OP13-113', 'OP13-113', BLUE, BLUE]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
  });
});

describe('OP13-113 Lilith: [Trigger] activate this card’s [On Play]', () => {
  function hit() {
    const g = theirs(YL.neutral, { life: ['OP13-113', RED, RED, RED], deck: [...TOP4, ...REST] });
    hitLeader(g);
    return g;
  }

  it('activating runs the look-at-4 search; the Lilith card is then trashed', () => {
    const g = hit();
    activateTrigger(g);
    checkLook(g, { candidates: [SC.speed, EVENT_TRIG], pick: [SC.speed] });
    expect(hand(g)).toEqual([SC.speed]);
    expect(trash(g)).toEqual(['OP13-113']);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the [Trigger] leaves the deck alone and puts Lilith in hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual(['OP13-113']);
    expect(deck(g)).toHaveLength(13);
  });
});
