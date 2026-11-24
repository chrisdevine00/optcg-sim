/**
 * OP15-053 Rebecca (Character, Blue, cost 1, 0 power, Counter +1000, {Dressrosa}).
 *
 * Card text: "[DON!! x1] This Character gains [Blocker].
 * [On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Dressrosa} type card and add it
 * to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 8-3-2-3 / rules-digest 87 ([DON!! xX] needs X or more DON!! given to this card), CR 10-1-4
 * ([Blocker]), CR 8-4-4-1 ("up to"), CR 11-2-1 (a card added from a look is revealed), CR 3-1-7 (the owner
 * orders several cards placed together).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passCounter } from '../../helpers.ts';
import {
  at,
  atMain,
  block,
  BLUE,
  deck,
  fill,
  hand,
  hasEvent,
  inst,
  kind,
  kws,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  outcomes,
  pickCards,
  playRaw,
  reachablePickSets,
  SC15,
  SCN,
  settleOrders,
  tail,
  theirs,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const REBECCA = 'OP15-053';
/** OP04-096 Corrida Coliseum: Stage, cost 1, {Dressrosa}. */
const DRESS_STAGE = 'OP04-096';
const BELLAMY = SC15.bellamy;
const GILLY = SC15.gilly;
const REST = fill(BLUE, 8);

function start(top: string[]): TestGame {
  return mine(LD15.shc, { hand: [REBECCA], deck: [...top, ...REST] });
}
const finish = (g: TestGame) => {
  settleOrders(g);
  expect(atMain(g)).toBe(true);
};

describe('OP15-053 Rebecca: [DON!! x1] [Blocker]; [On Play] look at 3, add up to 1 {Dressrosa}, rest to the bottom', () => {
  it('offers exactly the {Dressrosa} cards among the top 3; the pick goes to hand, the other two to the bottom', () => {
    const g = start([BELLAMY, BLUE, GILLY]);
    playRaw(g, REBECCA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BELLAMY, GILLY].sort());
    pickCards(g, [GILLY]);
    finish(g);
    expect(hand(g)).toEqual([GILLY]);
    const d = deck(g);
    expect(d).toHaveLength(10);
    expect(d.slice(0, 8)).toEqual(REST);
    expect(tail(d, 2)).toEqual([BELLAMY, BLUE].sort());
  });

  it('the added card is revealed, the others are not', () => {
    const g = start([BELLAMY, BLUE, SCN.c2]);
    playRaw(g, REBECCA);
    pickCards(g, [BELLAMY]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: BELLAMY })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: BLUE })).toBe(false);
  });

  it('"up to 1": adding nothing is legal and all three go to the bottom', () => {
    const g = start([BELLAMY, BLUE, GILLY]);
    playRaw(g, REBECCA);
    need(g, 'choose', 'p1');
    none(g);
    finish(g);
    expect(hand(g)).toEqual([]);
    const d = deck(g);
    expect(d).toHaveLength(11);
    expect(d.slice(0, 8)).toEqual(REST);
    expect(tail(d, 3)).toEqual([BELLAMY, BLUE, GILLY].sort());
  });

  it('adds at most one card even when all three match', () => {
    const g = start([BELLAMY, GILLY, SC15.hajrudin]);
    playRaw(g, REBECCA);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 3 are looked at: a match in 4th place is not offered', () => {
    const g = start([BLUE, SCN.c2, SCN.c3, BELLAMY]);
    playRaw(g, REBECCA);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(BELLAMY);
  });

  it('any card type counts: a {Dressrosa} Stage is offered', () => {
    const g = start([DRESS_STAGE, BLUE, SCN.c2]);
    playRaw(g, REBECCA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRESS_STAGE]);
    pickCards(g, [DRESS_STAGE]);
    finish(g);
    expect(hand(g)).toEqual([DRESS_STAGE]);
  });

  it('with no {Dressrosa} card in the top 3 nothing is added and all three go to the bottom', () => {
    const g = start([BLUE, SCN.c2, SCN.c3]);
    playRaw(g, REBECCA);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    finish(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([BLUE, SCN.c2, SCN.c3].sort());
    expect(deck(g)[0]).toBe(BLUE);
    expect(deck(g)).toHaveLength(11);
  });

  it('"in any order": both orders of the two cards placed at the bottom are reachable', () => {
    const g = start([BELLAMY, SCN.c2, SCN.c3]);
    playRaw(g, REBECCA);
    need(g, 'choose', 'p1');
    pickCards(g, [BELLAMY]);
    const orders = outcomes(g, 'p1', (game) => deck(game).slice(-2).join('>'));
    expect(orders.has(`${SCN.c2}>${SCN.c3}`)).toBe(true);
    expect(orders.has(`${SCN.c3}>${SCN.c2}`)).toBe(true);
  });

  it('[DON!! x1]: no [Blocker] without a given DON!!, [Blocker] with one (also on the opponent’s turn)', () => {
    const bare = theirs(LD15.shc, { characters: [REBECCA] }, { characters: [SCN.c3] });
    expect(kws(bare, at(bare, 'p1', 'characters', REBECCA))).not.toContain('Blocker');
    attack(bare, inst(bare, 'p2', 'characters', SCN.c3), bare.leader('p1'));
    expect(blockers(bare)).toEqual([]);

    const g = theirs(
      LD15.shc,
      { characters: [{ card: REBECCA, don: 1 }], costArea: { active: 0, rested: 0 } },
      { characters: [SCN.c3] },
    );
    expect(kws(g, at(g, 'p1', 'characters', REBECCA))).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', REBECCA)]);
    block(g, at(g, 'p1', 'characters', REBECCA));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('with more than 1 DON!! the keyword still holds, and on my turn the power is 0 + 1000 per DON!!', () => {
    const g = mine(LD15.shc, {
      characters: [{ card: REBECCA, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(kws(g, at(g, 'p1', 'characters', REBECCA))).toContain('Blocker');
    expect(g.power(at(g, 'p1', 'characters', REBECCA))).toBe(2000);
  });
});
