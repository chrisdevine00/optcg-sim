/**
 * EB03-048 Rebecca (Character, Black, cost 2, 0 power, Counter +1000, {Dressrosa}).
 *
 * Card text: "[Blocker]
 * [On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Dressrosa} type Stage card
 * and add it to your hand. Then, place the rest at the bottom of your deck in any order and play
 * up to 1 {Dressrosa} type Stage card with a cost of 1 from your hand."
 *
 * Rules: CR 11-2-1 (revealing), CR 4-8-1 ("up to"), CR 3-8 (playing a Stage replaces the old one,
 * which is trashed), exact type match ({Dressrosa} is not {Sky Island}).
 * Scenery: OP04-096 Corrida Coliseum (Black Stage, cost 1, {Dressrosa}; static only),
 * OP15-057 Dressrosa Kingdom (Blue Stage, cost 1, {Dressrosa}; draws only with a {Dressrosa} Leader),
 * OP05-117 Upper Yard (Yellow Stage, cost 1, {Sky Island}), ST04-017 Onigashima Island (Stage, cost 3).
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
} from './kit-eb03b.ts';

const ID = 'EB03-048';
const CORRIDA = 'OP04-096';
const KINGDOM = 'OP15-057';
const UPPER = 'OP05-117'; // {Sky Island} Stage, cost 1
const ONIGASHIMA = 'ST04-017'; // {Animal Kingdom Pirates} Stage, cost 3
const GILLY = 'OP10-054'; // {Dressrosa} Character (not a Stage), cost 3, vanilla
const MARCO = 'OP01-023';

function start(o: { top: string[]; hand?: string[]; stage?: string }) {
  return mine(LB.luffy, {
    hand: [ID, ...(o.hand ?? [])],
    deck: [...o.top, ...Array.from({ length: 8 }, () => BLUE)],
    ...(o.stage ? { stage: o.stage } : {}),
    costArea: { active: 10, rested: 0 },
  });
}

function stageOf(g: ReturnType<typeof start>) {
  return g.zone('p1', 'stage').map((c) => c.card);
}

/** Skip an empty "add" pick if the engine asks it, then settle the order of the rest. */
function afterLook(g: ReturnType<typeof start>) {
  settleOrders(g);
}

describe('EB03-048 Rebecca: [Blocker]; [On Play] look at 5, add up to 1 {Dressrosa} Stage, rest to the bottom, play up to 1 cost-1 {Dressrosa} Stage from hand', () => {
  it('adds a {Dressrosa} Stage from the top 5 to hand, puts the rest at the bottom, then plays it', () => {
    const g = start({ top: [MARCO, CORRIDA, MARCO, MARCO, MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CORRIDA]);
    pickCards(g, [CORRIDA]);
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CORRIDA]);
    pickCards(g, [CORRIDA]);
    expect(atMain(g)).toBe(true);
    expect(stageOf(g)).toEqual([CORRIDA]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
    expect(tail(deck(g), 4)).toEqual([MARCO, MARCO, MARCO, MARCO]);
  });

  it('the look offers {Dressrosa} Stage cards only: not a {Dressrosa} Character, not another Stage', () => {
    const g = start({ top: [GILLY, UPPER, ONIGASHIMA, KINGDOM, CORRIDA] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CORRIDA, KINGDOM].sort());
  });

  it('the Stage added is revealed; the other looked-at cards are not', () => {
    const g = start({ top: [MARCO, CORRIDA, MARCO, MARCO, MARCO] });
    put(g, ID);
    pickCards(g, [CORRIDA]);
    afterLook(g);
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(hasEvent(g, 'CardRevealed', { card: CORRIDA })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: MARCO })).toBe(false);
  });

  it('only the top 5 are looked at: a Stage in 6th place is not offered', () => {
    const g = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO, CORRIDA] });
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
    expect(deck(g)[0]).toBe(CORRIDA);
  });

  it('the play offers only {Dressrosa} Stage cards of cost 1 in hand: not a {Sky Island} Stage of cost 1, not a cost-3 Stage', () => {
    const g = start({
      top: [MARCO, MARCO, MARCO, MARCO, MARCO],
      hand: [KINGDOM, UPPER, ONIGASHIMA, GILLY],
    });
    put(g, ID);
    if (kind(g) === 'choose' && choices(g).length === 0) act(g, { type: 'done' });
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KINGDOM]);
  });

  it('a Stage already in hand can be played even when the top 5 hold none, and the play pick is asked with no candidate too', () => {
    const withStage = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO], hand: [CORRIDA] });
    put(withStage, ID);
    if (kind(withStage) === 'choose' && choices(withStage).length === 0)
      act(withStage, { type: 'done' });
    afterLook(withStage);
    pickCards(withStage, [CORRIDA]);
    expect(stageOf(withStage)).toEqual([CORRIDA]);

    const without = start({ top: [MARCO, MARCO, MARCO, MARCO, MARCO], hand: [MARCO] });
    put(without, ID);
    if (kind(without) === 'choose' && choices(without).length === 0) act(without, { type: 'done' });
    afterLook(without);
    need(without, 'choose', 'p1');
    expect(offeredIds(without)).toEqual([]);
    expect(canFinish(without)).toBe(true);
    act(without, { type: 'done' });
    expect(atMain(without)).toBe(true);
  });

  it('"up to 1": with two Stages on top only one can be added; adding none is allowed', () => {
    const g = start({ top: [CORRIDA, KINGDOM, MARCO, MARCO, MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(CORRIDA)).toBe(true);
    expect(sets.has(KINGDOM)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('adding none: all 5 cards go to the bottom and nothing can be played', () => {
    const g = start({ top: [CORRIDA, MARCO, MARCO, MARCO, MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    afterLook(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(stageOf(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([CORRIDA, MARCO, MARCO, MARCO, MARCO].sort());
  });

  it('the Stage added may be kept in hand instead of played ("up to 1")', () => {
    const g = start({ top: [CORRIDA, MARCO, MARCO, MARCO, MARCO] });
    put(g, ID);
    pickCards(g, [CORRIDA]);
    afterLook(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([CORRIDA]);
    expect(stageOf(g)).toEqual([]);
  });

  it('playing the new Stage over an old one trashes the old Stage', () => {
    const g = start({ top: [CORRIDA, MARCO, MARCO, MARCO, MARCO], stage: UPPER });
    put(g, ID);
    pickCards(g, [CORRIDA]);
    afterLook(g);
    pickCards(g, [CORRIDA]);
    expect(stageOf(g)).toEqual([CORRIDA]);
    expect(trash(g)).toEqual([UPPER]);
  });

  it('[Blocker]: it can block an attack on my Leader', () => {
    const g = theirs(LB.luffy, { characters: [ID] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});
