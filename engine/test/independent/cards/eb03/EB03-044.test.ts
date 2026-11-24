/**
 * EB03-044 Black Maria (Character, Black, cost 3, 4000, Counter +1000, {Animal Kingdom Pirates}).
 *
 * Card text: "If your Leader is multicolored, this Character gains [Blocker].
 * [On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Onigashima Island] and add
 * it to your hand. Then, place the rest at the bottom of your deck in any order and play up to 1
 * [Onigashima Island] from your hand."
 *
 * Rules: CR 11-2-1 (revealing), CR 4-8-1 ("up to"), CR 3-8 (a Stage played over another replaces
 * it: the old one is trashed), CR 2-4-2 (card name), "multicolored" is two or more colours.
 * Scenery: ST04-017 Onigashima Island (Stage, Purple, cost 3, {Animal Kingdom Pirates}).
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  blockers,
  canFinish,
  choices,
  deck,
  donSum,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  reachablePickSets,
  settleOrders,
  tail,
  theirs,
  trash,
  SC,
} from './kit-eb03b.ts';

const ID = 'EB03-044';
const ISLAND = 'ST04-017';
const STAGE2 = SC.upperYard; // OP05-117 Upper Yard: Yellow Stage, cost 1
const MARCO = 'OP01-023';

/** Top of deck first: `top` then 8 fillers. */
function start(o: {
  top: string[];
  hand?: string[];
  stage?: string;
  leader?: string;
  active?: number;
}) {
  return mine(o.leader ?? LB.luffy, {
    hand: [ID, ...(o.hand ?? [])],
    deck: [...o.top, ...Array.from({ length: 8 }, () => BLUE)],
    ...(o.stage ? { stage: o.stage } : {}),
    costArea: { active: o.active ?? 10, rested: 0 },
  });
}

/** After the look prompt: settle ordering of the rest and return when the hand-play prompt is pending (or Main). */
function afterLook(g: ReturnType<typeof start>) {
  settleOrders(g);
}

function stageOf(g: ReturnType<typeof start>, who: 'p1' | 'p2' = 'p1') {
  return g.zone(who, 'stage').map((c) => c.card);
}

describe('EB03-044 Black Maria: [Blocker] with a multicolored Leader; [On Play] look at 5, add up to 1 [Onigashima Island], rest to the bottom, play up to 1 [Onigashima Island] from hand', () => {
  it('finds an [Onigashima Island] in the top 5, adds it to hand, puts the other 4 at the bottom, then plays it', () => {
    const top = [MARCO, ISLAND, MARCO, MARCO, MARCO];
    const g = start({ top });
    const donBefore = donSum(g);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ISLAND]);
    pickCards(g, [ISLAND]);
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ISLAND]);
    pickCards(g, [ISLAND]);
    expect(atMain(g)).toBe(true);
    expect(stageOf(g)).toEqual([ISLAND]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
    expect(tail(deck(g), 4)).toEqual([MARCO, MARCO, MARCO, MARCO]);
    expect(deck(g)[0]).toBe(BLUE);
    // The Stage was played by the effect: no DON!! were rested for it (only Black Maria's 3).
    expect(donSum(g).rested).toBe(donBefore.rested + 3);
  });

  it('the Island is revealed when added; the other looked-at cards are not', () => {
    const g = start({ top: [MARCO, ISLAND, MARCO, MARCO, MARCO] });
    put(g, ID);
    pickCards(g, [ISLAND]);
    afterLook(g);
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(hasEvent(g, 'CardRevealed', { card: ISLAND })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MARCO })).toBe(false);
  });

  it('only the top 5 are looked at: an Island in 6th place is not offered', () => {
    const g = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO, ISLAND] });
    put(g, ID);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    afterLook(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(stageOf(g)).toEqual([]);
    expect(deck(g)[0]).toBe(ISLAND);
  });

  it('an [Onigashima Island] that was already in hand can be played even if none is found in the top 5', () => {
    const g = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO], hand: [ISLAND] });
    put(g, ID);
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ISLAND]);
    pickCards(g, [ISLAND]);
    expect(stageOf(g)).toEqual([ISLAND]);
    expect(tail(deck(g), 5)).toEqual([MARCO, MARCO, MARCO, MARCO, MARCO]);
  });

  it('the play pick is asked even when the hand holds no [Onigashima Island] (the prompt must not reveal the hidden hand)', () => {
    const g = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO], hand: [MARCO] });
    put(g, ID);
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(stageOf(g)).toEqual([]);
  });

  it('"up to 1": with two Islands on top only one can be added', () => {
    const g = start({ top: [ISLAND, ISLAND, MARCO, MARCO, MARCO] });
    put(g, ID);
    const sets = reachablePickSets(g);
    expect(sets.has(ISLAND)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"up to 1" on the add: may take none; every looked-at card then goes to the bottom, and the play finds nothing', () => {
    const g = start({ top: [MARCO, ISLAND, MARCO, MARCO, MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    afterLook(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(stageOf(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([ISLAND, MARCO, MARCO, MARCO, MARCO].sort());
  });

  it('"up to 1" on the play: the Island added to hand may be kept instead of played', () => {
    const g = start({ top: [ISLAND, MARCO, MARCO, MARCO, MARCO] });
    put(g, ID);
    pickCards(g, [ISLAND]);
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([ISLAND]);
    expect(stageOf(g)).toEqual([]);
  });

  it('playing the Island over an existing Stage trashes that Stage', () => {
    const g = start({ top: [ISLAND, MARCO, MARCO, MARCO, MARCO], stage: STAGE2 });
    expect(stageOf(g)).toEqual([STAGE2]);
    put(g, ID);
    pickCards(g, [ISLAND]);
    afterLook(g);
    pickCards(g, [ISLAND]);
    expect(stageOf(g)).toEqual([ISLAND]);
    expect(trash(g)).toEqual([STAGE2]);
  });

  it('[Blocker] only with a multicolored Leader: a two-colour Leader grants it, a one-colour Leader does not', () => {
    const multi = theirs(LB.lim, { characters: [ID] });
    attack(multi, multi.leader('p2'), multi.leader('p1'));
    expect(blockers(multi)).toEqual([multi.find('p1', 'characters', ID)]);
    const mono = theirs(LB.luffy, { characters: [ID] });
    attack(mono, mono.leader('p2'), mono.leader('p1'));
    expect(blockers(mono)).toEqual([]);
  });
});
