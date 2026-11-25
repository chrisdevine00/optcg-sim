/**
 * OP10-039 Gum-Gum Dragon Fire Pistol Twister Star (Event, Green, cost 3, {Straw Hat Crew}/
 * {Supernovas}/{ODYSSEY}).
 *
 * Card text: "[Main] If your Leader has the {ODYSSEY} type, look at 5 cards from the top of your
 * deck; reveal up to 2 {ODYSSEY} type Character cards and add them to your hand. Then, place the
 * rest at the bottom of your deck in any order.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 5 or less."
 *
 * Rules: CR 8-4-4 ("look at", "up to"), CR 11-2-1 (reveal), CR 8-3-3 / RD 122 (a failed "If" ends
 * the effect), DECISIONS 2026-11-24 (a prompt never depends on hidden cards: an "up to" pick over
 * the looked-at cards is asked even when nothing qualifies).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  askedEmpty,
  atMain,
  BLUE,
  declineTrigger,
  deck,
  deckTop,
  hand,
  hitLeader,
  kind,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredIds,
  offeredInst,
  pickCards,
  pickInst,
  playId,
  reachablePickSets,
  SC10,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-039';
const MISS = SC10.c2;
/** Two ODYSSEY Characters, one plain {ODYSSEY} and one with several types. */
const OD_A = SC10.od4; // OP09-038 {CP9}/{ODYSSEY}
const OD_B = SC10.od2; // OP10-033 {Straw Hat Crew}/{ODYSSEY}
const OD_C = SC10.od5; // OP10-024

function start(top: string[], leader: string = LD10.odyssey) {
  const g = mine(leader, { hand: [ID], deck: deckTop(top) });
  playId(g, ID);
  return g;
}

describe('OP10-039 Main: with an {ODYSSEY} Leader, look at 5, add up to 2 {ODYSSEY} Characters, rest to the bottom', () => {
  it('offers exactly the {ODYSSEY} Characters among the top 5; two picks go to hand, the rest to the bottom', () => {
    const g = start([OD_A, MISS, OD_B, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OD_A, OD_B].sort());
    pickCards(g, [OD_A, OD_B]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([OD_A, OD_B].sort());
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 3)).toEqual([MISS, MISS, MISS]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 2": at most two cards can be added even with three candidates, and zero or one are allowed', () => {
    const g = start([OD_A, OD_B, OD_C, MISS, MISS]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(OD_A)).toBe(true);
    expect(sets.has([OD_A, OD_B].sort().join('+'))).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('only the top 5 are looked at: an {ODYSSEY} card in position 6 is not offered and stays on top of the rest', () => {
    const g = start([MISS, MISS, MISS, MISS, MISS, OD_A]);
    askedEmpty(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    // The looked-at five went below the sixth card, which is now on top.
    expect(deck(g)[0]).toBe(OD_A);
    expect(tail(deck(g), 5)).toEqual([MISS, MISS, MISS, MISS, MISS]);
  });

  it('"up to": choosing nothing adds no card; all five go to the bottom', () => {
    const g = start([OD_A, MISS, OD_B, MISS, MISS]);
    none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([OD_A, OD_B, MISS, MISS, MISS].sort());
  });

  it('only Characters count: a card that is not an {ODYSSEY} Character is not offered', () => {
    const g = start([OD_A, SC10.c5, 'OP10-039', MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OD_A]);
  });

  it('the added cards are revealed (CR 11-2-1); a card that is not added is not', () => {
    const g = start([OD_A, MISS, OD_B, MISS, MISS]);
    pickCards(g, [OD_A]);
    settleOrders(g);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === OD_A)).toBe(true);
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === OD_B)).toBe(false);
  });

  it('a Leader without the {ODYSSEY} type: the "If" fails, nothing is looked at, the Event is just trashed', () => {
    const g = start([OD_A, OD_B, MISS, MISS, MISS], LD10.neutral);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(OD_A);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g)).toEqual([ID]);
  });

  it('the Leader type, not the Characters, is checked: {ODYSSEY} Characters on my field do not help a non-{ODYSSEY} Leader', () => {
    const g = mine(LD10.supernovas, {
      hand: [ID],
      characters: [OD_A],
      deck: deckTop([OD_B, MISS, MISS, MISS, MISS]),
    });
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(OD_B);
  });
});

describe('OP10-039 [Trigger]: rest up to 1 opposing Character with a cost of 5 or less', () => {
  function trig(p2: string[] = [SC10.c5, SC10.c6]) {
    const g = theirs(LD10.neutral, { life: [ID, BLUE, BLUE, BLUE] }, { characters: p2 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('rests a cost-5 Character; a cost-6 Character is not a candidate (no ODYSSEY Leader needed)', () => {
    const g = trig();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c5)]);
    expect(g.card(g.find('p2', 'characters', SC10.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', SC10.c6)).rested).toBe(false);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = trig();
    activateTrigger(g);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('the [Trigger] does not look at the deck', () => {
    const g = trig([SC10.c4]);
    const before = deck(g).length;
    activateTrigger(g);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(deck(g)).toHaveLength(before);
    expect(kind(g)).toBe('main');
  });

  it('declining adds the Event to my hand and rests nothing', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});
