/**
 * OP10-006 Caesar Clown (Character, Red, cost 7, 7000, no Counter, {Punk Hazard}/{Scientist}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Smiley] and add it
 * to your hand. Then, place the rest at the bottom of your deck in any order and play up to 1
 * [Smiley] from your hand."
 *
 * Rules: look at exactly the top 5; "[Smiley]" is by card name; "up to 1" may be none for both the
 * add and the play; the play is from the hand and may be a [Smiley] that was already in the hand;
 * a Character played by an effect pays no cost and its own [On Play] fires (CR 8-1; RL-05 for a
 * full Character area). Smiley (OP10-009, cost 5, 6000) is a vanilla-sized body for the tests.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  cardIds,
  choiceCards,
  chooseCards,
  deck,
  don,
  fill,
  hand,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  settleOrders,
  tail,
  V10,
  VAN,
} from './kit-op10a.ts';
import type { CardId } from '@optcg/engine';

const CAESAR = 'OP10-006';
const SMILEY = 'OP10-009';
/** OP10-002 Caesar Clown: Leader, {Punk Hazard}/{Scientist}. [DON!! x2][When Attacking] only. */
const PH_LEADER = 'OP10-002';

const TOP: CardId[] = [SMILEY, VAN.marco, V10.mochaPh4, VAN.hajrudin, VAN.sai];

function start(
  top: CardId[],
  opts: { hand?: CardId[]; leader?: string; opp?: Parameters<typeof mine>[2] } = {},
) {
  const g = mine(
    opts.leader ?? 'ST01-001',
    { hand: [CAESAR, ...(opts.hand ?? [])], deck: [...top, VAN.kingdew, ...fill(BLUE, 8)] },
    opts.opp ?? {},
  );
  playRaw(g, CAESAR);
  return g;
}

describe('OP10-006 Caesar Clown: [On Play] look at 5, add up to 1 [Smiley], rest to the bottom, play up to 1 [Smiley]', () => {
  it('printed values: cost 7, 7000, no Counter', () => {
    const g = mine('ST01-001', { hand: [CAESAR] });
    const c = g.find('p1', 'hand', CAESAR);
    expect(g.card(c).cost).toBe(7);
    expect(g.card(c).counter ?? null).toBeNull();
  });

  it('a [Smiley] in the top 5 is added, the other 4 go to the bottom, then the [Smiley] is played from the hand', () => {
    const g = start(TOP);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([SMILEY]);
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SMILEY]);
    pickCards(g, [SMILEY]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CAESAR, SMILEY].sort());
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(VAN.kingdew);
    expect(tail(deck(g), 4)).toEqual([VAN.marco, V10.mochaPh4, VAN.hajrudin, VAN.sai].sort());
    expect(deck(g)).toHaveLength(13);
    expect(kind(g)).toBe('main');
  });

  it('only the card named [Smiley] is offered; every other card of the top 5 is not', () => {
    const g = start([VAN.marco, V10.mochaPh4, SMILEY, V10.namiPh, 'OP10-012']);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([SMILEY]);
  });

  it('"up to 1": adding nothing is allowed; all 5 go to the bottom and no Smiley is in the hand to play', () => {
    const g = start(TOP);
    none(g);
    settleOrders(g, 'p1');
    // The play from the hand has nothing to pick.
    if (kind(g) === 'choose') none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CAESAR]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('only the top 5 are looked at: a [Smiley] in 6th place is not offered', () => {
    const g = mine('ST01-001', {
      hand: [CAESAR],
      deck: [VAN.marco, VAN.sai, VAN.hajrudin, VAN.komachiyo, VAN.thatch, SMILEY, ...fill(BLUE, 8)],
    });
    playRaw(g, CAESAR);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([]);
  });

  it('the play is from the hand: a [Smiley] already in the hand can be played even when none is found', () => {
    const g = start([VAN.marco, VAN.sai, VAN.hajrudin, VAN.komachiyo, VAN.thatch], {
      hand: [SMILEY],
    });
    none(g);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [SMILEY]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CAESAR, SMILEY].sort());
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1" on the play: the added [Smiley] may stay in the hand', () => {
    const g = start(TOP);
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CAESAR]);
    expect(hand(g)).toEqual([SMILEY]);
  });

  it('at most 1 [Smiley] is played even when two are in the hand', () => {
    const g = start(TOP, { hand: [SMILEY] });
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [SMILEY]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === SMILEY)).toHaveLength(1);
    expect(hand(g)).toEqual([SMILEY]);
  });

  it('only a [Smiley] can be played: another Character in the hand is not offered', () => {
    const g = start(TOP, { hand: [VAN.marco, V10.mochaPh4] });
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SMILEY]);
  });

  it("the Smiley is played free of cost (no DON!! is spent beyond Caesar's 7)", () => {
    const g = start(TOP);
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    pickCards(g, [SMILEY]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
  });

  it("the played Smiley's own [On Play] fires: with a {Punk Hazard} Leader it gives -3000 to an opposing Character", () => {
    const g = start(TOP, { leader: PH_LEADER, opp: { characters: [VAN.kingdew] } });
    chooseCards(g, [SMILEY]);
    settleOrders(g, 'p1');
    pickCards(g, [SMILEY]);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(4000);
  });
});
