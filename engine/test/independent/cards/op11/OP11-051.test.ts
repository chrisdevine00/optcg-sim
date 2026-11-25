/**
 * OP11-051 Sanji (Blue Character, cost 6, 7000, no Counter, {Straw Hat Crew}/{The Vinsmoke Family}).
 *
 * Card text: "When this Character is K.O.'d by your opponent's effect, look at 5 cards from the top of
 * your deck and play up to 1 {Straw Hat Crew} type Character card with a cost of 5 or less. Then,
 * place the rest at the bottom of your deck in any order. [On Play] Return up to 1 Character with
 * 5000 base power or less to the owner's hand."
 *
 * Rules: the K.O. clause fires only for a K.O. by the opponent's effect, not for a battle K.O. The
 * played card enters active. "Up to 1" may be none. [On Play] may return either side's Character.
 */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../../../src/testing.ts';
import {
  at,
  attack,
  BLUE,
  C11,
  chars,
  deck,
  fill,
  hand,
  isRested,
  kind,
  L11,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playCard,
  settleNoCandidates,
  settleOrders,
  tail,
  theirs,
  trash,
  yes,
} from './kit-op11b.ts';

const SANJI = 'OP11-051';
/** OP15-100 Kamakiri: Yellow, cost 5, [On Play] you may trash this and add 1 Life to hand: K.O. up to 1 Character with cost 6 or less. */
const KAMAKIRI = 'OP15-100';
const D = (n: number) => fill(BLUE, n);

describe('OP11-051 Sanji: [On Play] return up to 1 Character with base power 5000 or less to its owner hand', () => {
  function play(own: string[], opp: string[]) {
    const g = mine(L11.mono, { hand: [SANJI], characters: own }, { characters: opp });
    playCard(g, SANJI);
    return g;
  }

  it('offers Characters of both sides with base power 5000 or less (5000 in, 6000 out); Sanji himself (7000) is not offered', () => {
    const g = play([C11.c3, C11.c4], [C11.c2, C11.c5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c2, C11.c3].sort());
  });

  it("an opposing Character returns to the OPPONENT's hand", () => {
    const g = play([], [C11.c3]);
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([C11.c3]);
    expect(hand(g)).toEqual([]);
  });

  it('my own Character may be returned to my hand', () => {
    const g = play([C11.c3], [C11.c2]);
    pickInst(g, [at(g, 'p1', 'characters', C11.c3)]);
    expect(hand(g)).toEqual([C11.c3]);
    expect(chars(g, 'p2')).toEqual([C11.c2]);
  });

  it('"up to 1": may return nothing', () => {
    const g = play([C11.c3], [C11.c2]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g).sort()).toEqual([SANJI, C11.c3].sort());
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('with only Characters above 5000 base power nothing happens', () => {
    const g = play([C11.c4], [C11.c5]);
    settleNoCandidates(g);
    expect(chars(g, 'p2')).toEqual([C11.c5]);
    expect(chars(g).sort()).toEqual([SANJI, C11.c4].sort());
  });
});

describe("OP11-051 Sanji: when K.O.'d by an opponent effect, look at 5 and play a {Straw Hat Crew} Character with cost 5 or less", () => {
  /** p2 plays Kamakiri and K.O.s Sanji (cost 6); p1 then owes the look. */
  function koedByEffect(top: string[]) {
    const g = theirs(
      L11.mono,
      { characters: [SANJI], deck: [...top, ...D(10)] },
      { hand: [KAMAKIRI] },
    );
    playCard(g, KAMAKIRI);
    yes(g);
    pickInst(g, [at(g, 'p1', 'characters', SANJI)]);
    return g;
  }
  const FIVE = [C11.shc3, C11.shc5, C11.shc6, C11.c4, C11.fire3];

  it('offers exactly the {Straw Hat Crew} Characters with cost 5 or less among the top 5 (cost 6 and other types are out)', () => {
    const g = koedByEffect(FIVE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.shc3, C11.shc5].sort());
  });

  it('plays the chosen card active and puts the other four at the bottom of the deck', () => {
    const g = koedByEffect(FIVE);
    pickInst(g, [at(g, 'p1', 'deck', C11.shc5)]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([C11.shc5]);
    expect(isRested(g, at(g, 'p1', 'characters', C11.shc5))).toBe(false);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 4)).toEqual([C11.shc3, C11.shc6, C11.c4, C11.fire3].sort());
    expect(trash(g)).toEqual([SANJI]);
  });

  it('"up to 1": may play nothing; all 5 looked-at cards go to the bottom', () => {
    const g = koedByEffect(FIVE);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
  });

  it('only the top 5 are looked at: a qualifying card in 6th place is not offered', () => {
    const g = koedByEffect([C11.c4, C11.c4, C11.c4, C11.c4, C11.c4, C11.shc3]);
    settleNoCandidates(g, true);
    expect(chars(g)).toEqual([]);
    expect(deck(g)[0]).toBe(C11.shc3);
  });

  it('an Event with the {Straw Hat Crew} type is not a Character and is not offered', () => {
    const g = koedByEffect([BLUE, 'OP11-059', C11.shc3, C11.c4, C11.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.shc3]);
  });

  it('a K.O. in battle does not trigger it: no look, no prompt', () => {
    const g = theirs(
      L11.mono,
      { characters: [{ card: SANJI, rested: true }], deck: [...FIVE, ...D(10)] },
      { characters: [C11.c6] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c6), at(g, 'p1', 'characters', SANJI));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([SANJI]);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(deck(g)[0]).toBe(C11.shc3);
  });

  it('an own-effect K.O. does not trigger the look (the cause must be the opponent’s effect)', () => {
    const g = mine(L11.mono, { characters: [SANJI], deck: [C11.shc3, ...D(14)] });
    g.state = applyOp(g.state, {
      op: 'ko',
      card: at(g, 'p1', 'characters', SANJI),
      by: 'p1',
    }).state;
    expect(kind(g)).not.toBe('choose');
    expect(chars(g)).toEqual([]);
    expect(at(g, 'p1', 'deck', C11.shc3)).toBeDefined();
  });
});
