/**
 * OP17-109 Charlotte Pudding (Character, Yellow, cost 3, 4000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] You may trash 1 card with a [Trigger] from your hand: Draw 3 cards.
 * [Trigger] Look at 5 cards from the top of your deck; reveal up to 1 {Big Mom Pirates} type card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-3-1-4 (a "may" cost can be skipped, then the effect does not activate), CR 8-3-1-3
 * (a cost that cannot be paid cannot be paid), CR 2-11-2 ("a card with a [Trigger]"), CR 8-4-4-2.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  checkLook,
  choiceCards,
  count,
  decline,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  mine,
  offered,
  playCard,
  payWith,
  RED,
  SC,
  settleYes,
  skipUnusable,
  tail,
  theirs,
  trash,
  YL,
} from './kit-a.ts';

const EVENT_TRIG = 'OP07-077';

function played(handExtra: string[]) {
  const g = mine(YL.bmp, {
    hand: ['OP17-109', ...handExtra],
    deck: [SC.opera, SC.anana, SC.bobbin, ...fill(BLUE, 10)],
  });
  playCard(g, 'OP17-109');
  return g;
}

describe('OP17-109 Charlotte Pudding: [On Play] trash a [Trigger] card to draw 3', () => {
  it('paying with a [Trigger] card trashes it and draws 3 cards', () => {
    const g = played([SC.speed, BLUE]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', SC.speed)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([SC.speed]);
    expect(hand(g)).toEqual([BLUE, SC.opera, SC.anana, SC.bobbin].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('only cards with a [Trigger] may be trashed for the cost (an Event with [Trigger] counts too)', () => {
    const g = played([SC.speed, BLUE, EVENT_TRIG, SC.anana]);
    accept(g);
    expect(choiceCards(g)).toEqual([SC.speed, EVENT_TRIG].sort());
  });

  it('CR 8-3-1-3: no [Trigger] card in hand, the cost cannot be paid and nothing is drawn', () => {
    const g = played([BLUE, SC.anana]);
    skipUnusable(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(deck(g)).toHaveLength(13);
    expect(trash(g)).toEqual([]);
  });

  it('CR 8-3-1-4: declining the cost draws nothing and trashes nothing', () => {
    const g = played([SC.speed, BLUE]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([BLUE, SC.speed].sort());
    expect(count(g, 'p1', 'deck')).toBe(13);
    expect(trash(g)).toEqual([]);
  });

  it('an empty hand cannot pay (Pudding herself has left the hand)', () => {
    const g = played([]);
    skipUnusable(g, 'p1');
    expect(deck(g)).toHaveLength(13);
  });
});

describe('OP17-109 Charlotte Pudding: [Trigger] look at 5, add up to 1 {Big Mom Pirates}', () => {
  function hit() {
    const g = theirs(YL.bmp, {
      life: ['OP17-109', RED, RED, RED],
      deck: [SC.genbo, SC.opera, BLUE, SC.speed, SC.anana, SC.bobbin, ...fill(BLUE, 8)],
    });
    hitLeader(g);
    return g;
  }

  it('activating offers the {Big Mom Pirates} cards among the top 5 only; the rest go to the bottom', () => {
    const g = hit();
    activateTrigger(g);
    // Top 5: Genbo, Opera, Mohji, Speed, Anana (Bobbin is 6th and must not be offered).
    checkLook(g, { candidates: [SC.opera, SC.anana], pick: [SC.opera] });
    expect(hand(g)).toEqual([SC.opera]);
    expect(deck(g)[0]).toBe(SC.bobbin);
    expect(tail(deck(g), 4)).toEqual([SC.genbo, BLUE, SC.speed, SC.anana].sort());
    expect(trash(g)).toEqual(['OP17-109']);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('may add nothing', () => {
    const g = hit();
    activateTrigger(g);
    checkLook(g, { candidates: [SC.opera, SC.anana], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
  });

  it('declining the [Trigger] adds Pudding to hand and the deck is untouched', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual(['OP17-109']);
    expect(deck(g)).toHaveLength(14);
  });
});
