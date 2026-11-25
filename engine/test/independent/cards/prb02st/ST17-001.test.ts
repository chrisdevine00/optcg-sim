/**
 * ST17-001 Crocodile (Character, cost 4, 5000, Counter +1000, {Baroque Works}/{The Seven Warlords of
 * the Sea}).
 *
 * Card text: "[On Play] Reveal 1 card from the top of your deck. If that card is a "The Seven Warlords
 * of the Sea" type card, draw 2 cards and place 1 card from your hand at the top of your deck."
 *
 * Rules: revealing shows the card to both players and leaves it on the deck (CR 11-2-1); the "If"
 * checks the revealed card's types (any category of card). A match: draw 2 (the revealed card is
 * the first one drawn), then place exactly 1 card from the hand (any card, not optional) on top of
 * the deck. No match: the card stays on top and nothing else happens.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  BLUE,
  canFinish,
  choices,
  deck,
  hand,
  hasEvent,
  kind,
  LDP,
  mine,
  need,
  pickInst,
  playRaw,
  SP,
} from './kit-prb02sta.ts';

const CR = 'ST17-001';
/** OP02-054 Gecko Moria: Blue, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. */
const W1 = 'OP02-054';
/** OP02-055 Dracule Mihawk: Blue, {The Seven Warlords of the Sea}. */
const W2 = 'OP02-055';
/** OP04-038 an Event with the types {Donquixote Pirates}/{The Seven Warlords of the Sea}. */
const W_EVENT = 'OP04-038';
const REST = Array.from({ length: 10 }, () => BLUE);

function play(top: string[], hnd: string[] = [SP.c1p3]) {
  const g = mine(LDP.neutral, { hand: [CR, ...hnd], deck: [...top, ...REST] });
  playRaw(g, CR);
  return g;
}

describe('ST17-001 Crocodile: [On Play] reveal the top; if a {The Seven Warlords of the Sea}: draw 2, place 1 hand card on the deck', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LDP.neutral, { characters: [CR] });
    const i = at(g, 'p1', 'characters', CR);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 5000, 1000]);
  });

  it('a Warlord on top: revealed, 2 cards drawn (the revealed one first), then a hand card is placed back on top', () => {
    const g = play([W1, SP.c2p4, SP.c3p5]);
    expect(hasEvent(g, 'CardRevealed', { card: W1 })).toBe(true);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([SP.c1p3, W1, SP.c2p4].sort());
    expect(choices(g)).toHaveLength(3);
    pickInst(g, [g.find('p1', 'hand', W1)]);
    expect(deck(g)[0]).toBe(W1);
    expect(hand(g)).toEqual([SP.c1p3, SP.c2p4].sort());
    expect(deck(g)).toHaveLength(12);
    expect(atMainOf(g)).toBe(true);
  });

  it('the card placed on top can be any card of the hand, not only the drawn ones', () => {
    const g = play([W2, SP.c2p4, SP.c3p5]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', SP.c1p3)]);
    expect(deck(g)[0]).toBe(SP.c1p3);
    expect(hand(g)).toEqual([W2, SP.c2p4].sort());
  });

  it('the placement is mandatory: exactly 1 card, no "done"', () => {
    const g = play([W1, SP.c2p4]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
  });

  it('a card with several types is a match (Moria is {Warlord} and {Thriller Bark Pirates})', () => {
    const g = play([W1, SP.c2p4]);
    expect(kind(g)).toBe('choose');
  });

  it('an Event with the Warlord type is a match as well (the check is on types, not on the category)', () => {
    const g = play([W_EVENT, SP.c2p4, SP.c3p5]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([SP.c1p3, W_EVENT, SP.c2p4].sort());
  });

  it('no match: the revealed card stays on top, nothing is drawn, nothing is asked', () => {
    const g = play([SP.c3p5, W1, SP.c2p4]);
    expect(hasEvent(g, 'CardRevealed', { card: SP.c3p5 })).toBe(true);
    expect(kind(g)).toBe('main');
    expect(deck(g)[0]).toBe(SP.c3p5);
    expect(deck(g)).toHaveLength(13);
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('only the TOP card is checked: a Warlord in 2nd position does not count', () => {
    const g = play([SP.c3p5, W1, W2]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('a Leader of another type does not matter (the condition is on the revealed card)', () => {
    const g = play([W2, SP.c2p4]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(3);
  });

  it('draws exactly 2 and places exactly 1: the hand grows by 1 net and the deck shrinks by 1 net', () => {
    const g = play([W1, SP.c2p4, SP.c3p5], []);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', SP.c2p4)]);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(SP.c2p4);
  });
});
