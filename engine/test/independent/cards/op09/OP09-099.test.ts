/**
 * OP09-099 Fullalead (Stage, Black, cost 1, {Blackbeard Pirates}).
 *
 * Card text: "[Activate: Main] You may trash 1 card from your hand and rest this Stage: Look at 3 cards
 * from the top of your deck; reveal up to 1 "Blackbeard Pirates" type card and add it to your hand.
 * Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-3-1 (costs), CR 8-3-1-3 (an unpayable cost cannot be paid), an optional cost paid from
 * the hidden hand is offered even when unpayable (accept illegal), CR 8-4-4 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  C9,
  deck,
  hand,
  hasEvent,
  L9,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  offeredUnpayable,
  payHand,
  pickCards,
  reachablePickSets,
  settleOrders,
  tail,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-op09d.ts';

const ID = 'OP09-099';

function start(o: { hand?: string[]; top?: string[]; leader?: string; rested?: boolean } = {}) {
  const g = mine(o.leader ?? L9.bb, {
    stage: { card: ID, rested: o.rested ?? false },
    hand: o.hand ?? [C9.c2, C9.c3],
    deck: [...(o.top ?? [C9.bb4, C9.c2, C9.bb5]), C9.c4, ...Array(8).fill(BLUE)],
  });
  return g;
}

/** Activate and pay (yes, then trash `fodder` from hand). Leaves the candidate pick pending. */
function pay(g: ReturnType<typeof start>, fodder: string) {
  useAbility(g, g.find('p1', 'stage', ID));
  payHand(g, [fodder]);
}

describe('OP09-099 Fullalead: [Activate: Main] trash 1 from hand and rest this Stage: look at 3, add up to 1 {Blackbeard Pirates}', () => {
  it('pays the cost (the chosen hand card is trashed, the Stage is rested), offers the {Blackbeard Pirates} cards of the top 3', () => {
    const g = start();
    pay(g, C9.c2);
    expect(trash(g)).toEqual([C9.c2]);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.bb4, C9.bb5].sort());
  });

  it('the pick goes to my hand (revealed) and the other 2 looked-at cards go to the bottom', () => {
    const g = start();
    pay(g, C9.c2);
    pickCards(g, [C9.bb5]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.c3, C9.bb5].sort());
    expect(deck(g)[0]).toBe(C9.c4);
    expect(deck(g)).toHaveLength(11);
    expect(tail(deck(g), 2)).toEqual([C9.bb4, C9.c2].sort());
    expect(hasEvent(g, 'CardRevealed', { card: C9.bb5 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: C9.bb4 })).toBe(false);
  });

  it('"up to 1": adding none is allowed, adding two is not; all 3 go to the bottom', () => {
    const g = start();
    pay(g, C9.c2);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([C9.c3]);
    expect(tail(deck(g), 3)).toEqual([C9.bb4, C9.c2, C9.bb5].sort());
  });

  it('only the top 3 are looked at: a {Blackbeard Pirates} card in 4th place is not offered', () => {
    const g = start({ top: [C9.c2, C9.c2, C9.c2, C9.bb4] });
    pay(g, C9.c2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('the cost is exactly 1 card: with two cards in hand only the chosen one is trashed', () => {
    const g = start({ hand: [C9.c2, C9.c3] });
    pay(g, C9.c3);
    expect(trash(g)).toEqual([C9.c3]);
    expect(hand(g)).toEqual([C9.c2]);
  });

  it('an empty hand cannot pay: the activation is not usable and changes nothing', () => {
    const g = start({ hand: [] });
    const [ability] = offeredAbilities(g, g.find('p1', 'stage', ID));
    if (ability) {
      // Offered anyway (the hand is hidden): it can only end with the cost unpaid.
      g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability });
      offeredUnpayable(g, 'p1');
    }
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
  });

  it('a rested Stage cannot be activated (it cannot pay "rest this Stage")', () => {
    const g = start({ rested: true });
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
  });

  it('no Leader type is required: a Leader that is not {Blackbeard Pirates} can use it', () => {
    const g = start({ leader: L9.neutral });
    pay(g, C9.c2);
    pickCards(g, [C9.bb4]);
    settleOrders(g);
    expect(hand(g)).toContain(C9.bb4);
  });

  it('it can be used again on a later turn, when the Stage has become active', () => {
    const g = start();
    pay(g, C9.c2);
    none(g);
    settleOrders(g);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
    toMyNextMain(g);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toHaveLength(1);
  });
});
