/**
 * ST22-001 Ace & Newgate (Leader, Blue, 5000, 5 Life, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may reveal 1 card with a type including
 * "Whitebeard Pirates" from your hand: Draw 1 card and place the revealed card at the top of your
 * deck."
 *
 * Rules: CR 8-3-1 (costs), 11-2 (reveal), 8-3-1-4 (a "you may" cost is optional).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  deck,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  payHand,
  SL,
  theirs,
  trash,
} from './kit-lfb.ts';

const ID = 'ST22-001';
const WB = SL.wb4; // Whitebeard Pirates
const FORMER = SL.former3; // Former Whitebeard Pirates: type includes the name
const ALLIES = SL.allies6; // Whitebeard Pirates Allies
const MISS = SL.miss;

function start(handCards: string[], deckTop: string[] = [SL.c2, SL.c4]) {
  return mine(ID, {
    hand: handCards,
    deck: [...deckTop, ...Array.from({ length: 10 }, () => MISS)],
  });
}

function activate(g: ReturnType<typeof start>) {
  const [ability] = offeredAbilities(g, g.leader('p1'));
  if (!ability) throw new Error('no ability offered');
  act(g, { type: 'activate', card: g.leader('p1'), ability });
}

describe('ST22-001 Ace & Newgate: [Activate: Main] reveal a Whitebeard Pirates card, draw 1, put it on top', () => {
  it('reveal, draw 1 and place the revealed card at the top of the deck', () => {
    const g = start([WB, MISS]);
    activate(g);
    payHand(g, [WB]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([MISS, SL.c2].sort());
    expect(deck(g)[0]).toBe(WB);
    expect(deck(g)).toHaveLength(12);
  });

  it('the draw comes first: the card drawn is the old top, not the revealed card', () => {
    const g = start([WB], [SL.c2, SL.c4]);
    activate(g);
    payHand(g, [WB]);
    expect(hand(g)).toEqual([SL.c2]);
    expect(deck(g).slice(0, 2)).toEqual([WB, SL.c4]);
  });

  it('the revealed card is revealed (CR 11-2-1) and an unrevealed one is not', () => {
    const g = start([WB, MISS]);
    activate(g);
    payHand(g, [WB]);
    expect(hasEvent(g, 'CardRevealed', { card: WB })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('only cards whose type includes "Whitebeard Pirates" are offered (Former and Allies qualify, a miss does not)', () => {
    const g = start([WB, FORMER, ALLIES, MISS]);
    activate(g);
    expect(offeredIds(g)).toEqual([WB, FORMER, ALLIES].sort());
  });

  it('a hand with no matching card cannot pay: the ability is not offered and nothing moves', () => {
    const g = start([MISS, SL.c4]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([MISS, SL.c4].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('an empty hand cannot pay either', () => {
    const g = start([]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('a matching card in hand makes the ability available; not using it changes nothing', () => {
    const g = start([WB, MISS]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    expect(hand(g)).toEqual([WB, MISS].sort());
    expect(deck(g)).toHaveLength(12);
    expect(hasEvent(g, 'CardRevealed', { card: WB })).toBe(false);
  });

  it('[Once Per Turn]: not offered again after it resolved', () => {
    const g = start([WB, SL.wb5]);
    activate(g);
    payHand(g, [WB]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('with exactly one card in hand the revealed card is not trashed: it is back on top of the deck', () => {
    const g = start([WB]);
    activate(g);
    if (kind(g) === 'choose') payHand(g, [WB]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)[0]).toBe(WB);
    expect(hand(g)).toEqual([SL.c2]);
  });

  it("must not happen: it cannot be activated on the opponent's turn", () => {
    const g = theirs(ID, { hand: [WB] });
    need(g, 'main', 'p2');
    expect(offeredAbilities(g, at(g, 'p1', 'leader', ID))).toEqual([]);
    expect(LB.aceNewgate).toBe(ID);
  });
});
