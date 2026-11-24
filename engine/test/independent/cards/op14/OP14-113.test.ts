/**
 * OP14-113 Marguerite (Character, Yellow, cost 3, 5000, no Counter, {Amazon Lily}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Amazon Lily} or {Kuja
 * Pirates} type card and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order and trash 1 card from your hand.
 * [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: CR 8-4-4, CR 11-2-1, CR 3-1-7 (owner orders), CR 10-1-5 ([Trigger]), RD 122 (a failed "If"
 * ends the effect). "Trash 1 card" is exact, not "up to".
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  at,
  atMain,
  BLUE,
  canFinish,
  chars,
  deck,
  deckTop,
  hand,
  hitLeader,
  kind,
  KJ,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  reachablePickSets,
  SC14,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-113';
const TOP5 = [KJ.sweetpea4, SC14.c2, KJ.rindo5, SC14.c4, SC14.c5];

function played(o: { top?: string[]; hand?: string[]; leader?: string } = {}) {
  const g = mine(o.leader ?? LD14.kuja, {
    hand: [ID, ...(o.hand ?? [])],
    deck: [...(o.top ?? TOP5), ...Array.from({ length: 9 }, () => BLUE)],
  });
  playId(g, ID);
  return g;
}

describe('OP14-113 Marguerite: [On Play] look at 5, add up to 1 Amazon Lily / Kuja Pirates, rest to the bottom, trash 1 from hand', () => {
  it('offers exactly the {Amazon Lily} and {Kuja Pirates} cards of the top 5, of either type', () => {
    const g = played();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KJ.sweetpea4, KJ.rindo5].sort());
  });

  it('"type": a card with several types qualifies through one of them; only the top 5 are looked at', () => {
    const g = played({ top: [SC14.c2, SC14.c4, SC14.c5, SC14.c6, SC14.c2, KJ.gorgon6] });
    // Nothing among the top 5 qualifies: the pick is still asked (a prompt never depends on hidden cards).
    askedEmpty(g);
    const h = played({ top: [KJ.gorgon6, SC14.c2, SC14.c4, SC14.c5, SC14.c6] });
    expect(offeredIds(h)).toEqual([KJ.gorgon6]);
  });

  it('another [Marguerite] is a legal pick (the text has no "other than")', () => {
    const g = played({ top: [ID, SC14.c2, SC14.c4, SC14.c5, SC14.c6] });
    expect(offeredIds(g)).toEqual([ID]);
  });

  it('adds the pick, puts the other 4 at the bottom, then trashes 1 card of my choice from the hand', () => {
    const g = played({ hand: [SC14.c6] });
    pickCards(g, [KJ.rindo5]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KJ.rindo5, SC14.c6].sort());
    pickCards(g, [SC14.c6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KJ.rindo5]);
    expect(trash(g)).toEqual([SC14.c6]);
    expect(tail(deck(g), 4)).toEqual([KJ.sweetpea4, SC14.c2, SC14.c4, SC14.c5].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('the card just added may itself be the one trashed', () => {
    const g = played({ hand: [SC14.c6] });
    pickCards(g, [KJ.rindo5]);
    settleOrders(g, 'p1');
    pickCards(g, [KJ.rindo5]);
    expect(hand(g)).toEqual([SC14.c6]);
    expect(trash(g)).toEqual([KJ.rindo5]);
  });

  it('the trash is exact, not "up to": it cannot be skipped and exactly 1 card goes', () => {
    const g = played({ hand: [SC14.c6, SC14.c7] });
    pickCards(g, [KJ.rindo5]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(1);
  });

  it('adding nothing is allowed ("up to 1"): all 5 go to the bottom and 1 hand card is still trashed', () => {
    const g = played({ hand: [SC14.c6] });
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    if (kind(g) === 'choose') pickCards(g, [SC14.c6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC14.c6]);
    expect(tail(deck(g), 5)).toEqual([...TOP5].sort());
  });

  it('adding nothing with an empty hand: there is nothing to trash and the effect ends', () => {
    const g = played();
    none(g);
    settleOrders(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });

  it('adds at most one card even when two qualify', () => {
    const g = played();
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has(KJ.sweetpea4)).toBe(true);
    expect(sets.has(KJ.rindo5)).toBe(true);
  });
});

describe('OP14-113 Marguerite: [Trigger] if my Leader has the {Kuja Pirates} type, play this card', () => {
  function hit(leader: string) {
    const g = theirs(
      leader,
      {
        life: [ID, BLUE, BLUE, BLUE],
        deck: deckTop([KJ.sweetpea4, SC14.c2, SC14.c4, SC14.c5, SC14.c6]),
      },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('with a {Kuja Pirates} Leader it is played active, and its [On Play] runs (look at 5)', () => {
    const g = hit(LD14.kuja);
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KJ.sweetpea4]);
  });

  it('with a Leader without {Kuja Pirates} nothing is played: the card is trashed', () => {
    const g = hit(LD14.neutral);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declined: the card goes to my hand', () => {
    const g = hit(LD14.kuja);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toContain(ID);
    expect(chars(g)).toEqual([]);
  });
});
