/**
 * OP16-002 Izo (Character, Red, cost 1, 2000, Counter +1000, {Land of Wano}/{Whitebeard Pirates}, Ranged).
 *
 * Card text: "[On Play] You may reveal 1 Character card with 8000 power from your hand: Draw 1 card."
 *
 * Rules: CR 8-3-1 (a cost that cannot be paid cannot be paid at all), CR 11-2-1 (revealing shows the
 * card; it does not move it), "a Character card with 8000 power" is read as power exactly 8000.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  deck,
  describeEightKCost,
  fill,
  hand,
  mine,
  OL,
  OV,
  payHand,
  playCard,
  need,
  yes,
  trash,
  n,
  at,
  charIds,
  unusable,
} from './kit-op16a.ts';

const IZO = 'OP16-002';
const DECK = fill(OV.sai4, 5);

function start(extra: string[], leader: string = OL.luffy) {
  const g = mine(leader, { hand: [IZO, ...extra], deck: DECK });
  playCard(g, IZO);
  return g;
}

describeEightKCost({
  id: IZO,
  verb: 'reveal',
  start,
  happened: (g) => n(g, 'p1', 'deck') < DECK.length,
});

describe('OP16-002 Izo: [On Play] reveal an 8000-power Character, draw 1', () => {
  it('Izo is played onto the field for its cost of 1 and the prompt follows', () => {
    const g = start([OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([IZO]);
    need(g, 'optional', 'p1');
  });

  it('paying draws exactly 1 card (the top card of the deck), the revealed card stays in hand', () => {
    const g = start([OV.thatch]);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([OV.sai4, OV.thatch].sort());
    expect(deck(g)).toHaveLength(DECK.length - 1);
    expect(trash(g)).toEqual([]);
  });

  it('the drawn card is the top card of the deck', () => {
    const g = mine(OL.luffy, { hand: [IZO, OV.thatch], deck: [OV.marco5, OV.sai4, OV.sai4] });
    playCard(g, IZO);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(hand(g)).toEqual([OV.marco5, OV.thatch].sort());
  });

  it('a revealed Character with power exactly 8000 that is a different type (not Whitebeard) also pays', () => {
    const g = start([OV.franky8]);
    yes(g);
    payHand(g, [OV.franky8]);
    expect(hand(g)).toEqual([OV.franky8, OV.sai4].sort());
  });

  it('only one card is drawn even when two 8000-power Characters are in hand', () => {
    const g = start([OV.thatch, OV.ramba]);
    yes(g);
    payHand(g, [OV.ramba]);
    expect(hand(g)).toEqual([OV.sai4, OV.thatch, OV.ramba].sort());
    expect(deck(g)).toHaveLength(DECK.length - 1);
  });

  it('Izo itself (2000 power) cannot pay: a hand with a second Izo only has no candidate', () => {
    const g = mine(OL.luffy, { hand: [IZO, IZO], deck: DECK });
    playCard(g, IZO);
    unusable(g, 'p1');
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([IZO]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(atMain(g)).toBe(true);
  });

  it('an 8000-power Character on the field does not count: only hand cards pay', () => {
    const g = mine(OL.luffy, { hand: [IZO], deck: DECK, characters: [OV.thatch] });
    playCard(g, IZO);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(at(g, 'p1', 'characters', OV.thatch)).toBeDefined();
  });

  it('an 8000-power Character in the trash does not count', () => {
    const g = mine(OL.luffy, { hand: [IZO], deck: DECK, trash: [OV.thatch] });
    playCard(g, IZO);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('must not: the opponent draws nothing and the opponent hand is untouched', () => {
    const g = mine(OL.luffy, { hand: [IZO, OV.thatch], deck: DECK }, { hand: [OV.sai4], deck: DECK });
    playCard(g, IZO);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(n(g, 'p2', 'hand')).toBe(1);
    expect(n(g, 'p2', 'deck')).toBe(DECK.length);
  });
});
