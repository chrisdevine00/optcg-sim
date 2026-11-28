/**
 * OP18-038 Shoot Down That Flag. (Event, Green, cost 1, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Main] Look at 5 cards from the top of your deck; reveal up to 1 [Sogeking] or {Straw Hat Crew}
 *    type card and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 *    [Trigger] Draw 1 card."
 *
 * Rules: only the top 5 are looked at; "up to 1" may take none; the card added is revealed
 * (CR 11-2-1); the rest go to the bottom (order is the owner's choice). "[Sogeking]" is a name
 * match, "{Straw Hat Crew}" a type match (CR 2-4-3-1). The Event costs 1 DON!!. [Trigger] draws 1
 * when the card is revealed from Life and activated.
 *
 * Scenery: EB02-024 Sogeking (Blue, {Sniper Island}, named [Sogeking]), OP03-122 Sogeking (Blue,
 * {Sniper Island}), OP02-028 Usopp and OP02-043 Zoro ({Straw Hat Crew}), OP01-023 Marco (no type).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  CH,
  choices,
  deck,
  declineTrigger,
  fill,
  hand,
  hasEvent,
  kind,
  LDR,
  mine,
  need,
  offeredIds,
  pickCards,
  reachablePickSets,
  settleOrders,
  skipPick,
  tail,
  theirs,
  hitLeader,
  donOf,
  playCard,
  trash,
  canCounterWith,
  minus,
  attack,
  passBlock,
} from './kit-ga.ts';

const FLAG = 'OP18-038';
const SOGEKING = 'EB02-024';
const SOGEKING7 = 'OP03-122';

const MISS = CH.marco3;
/** Top 5 (top first), then a matching card at position 6, then filler. */
const TOP = [CH.usopp3, MISS, CH.zoro4, SOGEKING, MISS];
const BEYOND = CH.jinbe2;
const REST = [BEYOND, ...fill(BLUE, 8)];

function begin(top: string[] = TOP, rest: string[] = REST) {
  const g = mine(LDR.luffy, { hand: [FLAG], deck: [...top, ...rest] });
  playCard(g, FLAG);
  return g;
}

function finish(g: ReturnType<typeof begin>) {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
}

describe('OP18-038 Shoot Down That Flag.: [Main] look at 5, add up to 1 [Sogeking] or {Straw Hat Crew}', () => {
  it('offers exactly the matching cards of the top 5 (by name and by type); the pick goes to hand', () => {
    const g = begin();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CH.usopp3, CH.zoro4, SOGEKING].sort());
    pickCards(g, [CH.zoro4]);
    finish(g);
    expect(hand(g)).toEqual([CH.zoro4]);
  });

  it('the rest of the looked-at cards go to the bottom of the deck, below the cards not looked at', () => {
    const g = begin();
    pickCards(g, [CH.zoro4]);
    finish(g);
    expect(deck(g)).toHaveLength(TOP.length + REST.length - 1);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [CH.zoro4]).sort());
  });

  it('"[Sogeking]" is a name match: a {Sniper Island} Sogeking with no {Straw Hat Crew} type is offered', () => {
    const g = begin([SOGEKING7, MISS, MISS, MISS, MISS]);
    expect(offeredIds(g)).toEqual([SOGEKING7]);
    pickCards(g, [SOGEKING7]);
    finish(g);
    expect(hand(g)).toEqual([SOGEKING7]);
  });

  it('a card with neither the name nor the type (Marco) is never offered', () => {
    const g = begin();
    expect(offeredIds(g)).not.toContain(MISS);
  });

  it('"up to 1": at most one card can be added even with three candidates', () => {
    const sets = reachablePickSets(begin());
    expect(sets.has('')).toBe(true);
    expect(sets.has(CH.zoro4)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"up to": adding nothing sends all 5 cards to the bottom', () => {
    const g = begin();
    need(g, 'choose');
    skipPick(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BEYOND);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('only the top 5 are looked at: a match in position 6 is not offered', () => {
    const g = begin([MISS, MISS, MISS, MISS, MISS], [CH.usopp3, ...fill(BLUE, 8)]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      skipPick(g);
    }
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(CH.usopp3);
  });

  it('with no match in the top 5 nothing is added and all 5 still go to the bottom', () => {
    const g = begin([MISS, MISS, MISS, MISS, MISS]);
    if (kind(g) === 'choose') skipPick(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual(fill(MISS, 5));
  });

  it('CR 11-2-1: the added card is revealed, the others are not', () => {
    const g = begin();
    pickCards(g, [CH.zoro4]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: CH.zoro4 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MISS })).toBe(false);
  });

  it('the Event costs 1 DON!! and goes to the trash', () => {
    const g = begin();
    expect(donOf(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    pickCards(g, [CH.zoro4]);
    finish(g);
    expect(trash(g)).toEqual([FLAG]);
  });

  it('it has no [Counter]: it cannot be used from hand in the Counter Step', () => {
    const g = theirs(LDR.luffy, { hand: [FLAG] }, { characters: [CH.kingdew5] });
    attack(g, g.find('p2', 'characters', CH.kingdew5), g.leader('p1'));
    passBlock(g);
    expect(canCounterWith(g, g.find('p1', 'hand', FLAG))).toBe(false);
  });
});

describe('OP18-038 Shoot Down That Flag.: [Trigger] draw 1 card', () => {
  const hit = () => {
    const g = theirs(
      LDR.luffy,
      { life: [FLAG, BLUE, BLUE, BLUE], deck: [CH.zoro4, ...fill(BLUE, 10)], hand: [] },
      {},
    );
    hitLeader(g);
    return g;
  };

  it('activating the [Trigger] from Life draws 1 card (and the Event itself is not added to hand)', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([CH.zoro4]);
    expect(trash(g)).toEqual([FLAG]);
  });

  it('declining the [Trigger] adds the card to hand and draws nothing', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([FLAG]);
  });

  it('the [Trigger] does not run the [Main] effect: no look at the deck', () => {
    const g = hit();
    activateTrigger(g);
    expect(kind(g)).not.toBe('choose');
    act(g, { type: 'endTurn' });
  });
});
