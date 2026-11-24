/**
 * EB03-060 Will You Be My Servant? (Event, Yellow, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] If your Leader is [Nami], look at 4 cards from the top of your deck; reveal up
 * to 1 card with a cost of 2 to 8 and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 2-4-2 (the Leader must be named Nami), CR 11-2-1 (reveal), CR 4-8-1 ("up to"),
 * CR 10-1-5 ([Trigger]: activating the Main effect, no cost paid).
 * Deck scenery: OP02-060 Mohji (cost 1), OP01-012 Sai (cost 2), OP01-023 Marco (cost 3),
 * OP12-005 Shiki (cost 8), OP01-070 Dracule Mihawk (cost 9), OP17-055 (Event, cost 0).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  canFinish,
  choices,
  deck,
  donSum,
  hand,
  hasEvent,
  hitLeader,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  put,
  reachablePickSets,
  settleOrders,
  tail,
  theirs,
} from './kit-eb03b.ts';

const ID = 'EB03-060';
const MOHJI = 'OP02-060'; // cost 1
const SAI = 'OP01-012'; // cost 2
const MARCO = 'OP01-023'; // cost 3
const SHIKI = 'OP12-005'; // cost 8
const MIHAWK = 'OP01-070'; // cost 9
const FREE_EVENT = 'OP17-055'; // Event, cost 0

function start(o: { top: string[]; leader?: string }) {
  return mine(o.leader ?? LB.nami, {
    hand: [ID],
    deck: [...o.top, ...Array.from({ length: 8 }, () => BLUE)],
    costArea: { active: 10, rested: 0 },
  });
}

function finishLook(g: ReturnType<typeof start>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('EB03-060 Will You Be My Servant?: [Main] with a [Nami] Leader, look at 4, add up to 1 card of cost 2 to 8, rest to the bottom; [Trigger] activate [Main]', () => {
  it('adds a card of cost 2 to 8 from the top 4 to hand and puts the other 3 at the bottom', () => {
    const g = start({ top: [MOHJI, MARCO, MOHJI, MOHJI] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MARCO]);
    pickCards(g, [MARCO]);
    finishLook(g);
    expect(hand(g)).toEqual([MARCO]);
    expect(deck(g)).toHaveLength(11);
    expect(tail(deck(g), 3)).toEqual([MOHJI, MOHJI, MOHJI]);
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('cost 2 and cost 8 are in range; cost 1, cost 9 and a cost-0 Event are not', () => {
    const g = start({ top: [SAI, SHIKI, MOHJI, MIHAWK] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI, SHIKI].sort());
    act(g, { type: 'done' });
    finishLook(g);

    const g2 = start({ top: [MOHJI, MIHAWK, FREE_EVENT, MOHJI] });
    put(g2, ID);
    if (kind(g2) === 'choose') {
      expect(choices(g2)).toHaveLength(0);
      act(g2, { type: 'done' });
    }
    finishLook(g2);
    expect(hand(g2)).toEqual([]);
  });

  it('the card added is revealed; the others looked at are not', () => {
    const g = start({ top: [MOHJI, MARCO, MOHJI, MOHJI] });
    put(g, ID);
    pickCards(g, [MARCO]);
    finishLook(g);
    expect(hasEvent(g, 'CardRevealed', { card: MARCO })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MOHJI })).toBe(false);
  });

  it('only the top 4 are looked at: a card of cost 3 in 5th place is not offered', () => {
    const g = start({ top: [MOHJI, MOHJI, MOHJI, MOHJI, MARCO] });
    put(g, ID);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    finishLook(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(MARCO);
  });

  it('"up to 1": may add nothing; all 4 looked-at cards go to the bottom', () => {
    const g = start({ top: [MARCO, SAI, MOHJI, MOHJI] });
    put(g, ID);
    none(g);
    finishLook(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(BLUE);
    expect(tail(deck(g), 4)).toEqual([MARCO, SAI, MOHJI, MOHJI].sort());
  });

  it('adds at most one card even when two qualify', () => {
    const g = start({ top: [MARCO, SAI, MOHJI, MOHJI] });
    put(g, ID);
    const sets = reachablePickSets(g);
    expect(sets.has(MARCO)).toBe(true);
    expect(sets.has(SAI)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with a Leader that is not [Nami] nothing is looked at: the Event is spent and the deck is untouched', () => {
    const g = start({ top: [MARCO, SAI, MOHJI, MOHJI], leader: LB.luffy });
    const before = deck(g);
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toEqual(before);
    expect(donSum(g).rested).toBe(1);
  });

  it('[Trigger] from the Life with a [Nami] Leader: the [Main] effect is activated for free', () => {
    const g = theirs(
      LB.nami,
      { life: [ID, BLUE, BLUE], deck: [MARCO, MOHJI, MOHJI, MOHJI, BLUE, BLUE] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MARCO]);
    pickCards(g, [MARCO]);
    settleOrders(g);
    expect(hand(g)).toEqual([MARCO]);
    expect(tail(deck(g), 3)).toEqual([MOHJI, MOHJI, MOHJI]);
  });

  it('[Trigger] with another Leader: nothing is looked at', () => {
    const g = theirs(
      LB.luffy,
      { life: [ID, BLUE, BLUE], deck: [MARCO, MOHJI, MOHJI, MOHJI, BLUE] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    act(g, {
      type: 'trigger',
      activate: g.legal().some((a) => a.type === 'trigger' && a.activate),
    });
    expect(deck(g)[0]).toBe(MARCO);
    expect(hand(g).filter((c) => c === MARCO)).toEqual([]);
    expect(canFinish).toBeDefined();
  });
});
