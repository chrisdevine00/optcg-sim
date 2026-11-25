/**
 * OP09-030 Trafalgar Law (Character, Green, cost 3, 4000, Counter +1000, {Heart Pirates}/
 * {Supernovas}/{ODYSSEY}).
 *
 * Card text: "[On Play] You may return 1 of your Characters to the owner's hand: Play up to 1
 * "ODYSSEY" type Character card with a cost of 3 or less other than [Trafalgar Law] from your
 * hand."
 *
 * Rules: the text before the colon is an optional cost: one of MY Characters (Law himself is on the
 * field, so he may be the one) goes back to my hand; the card played is chosen from the hand AFTER
 * the cost, so a card just returned could be chosen if it qualifies; the type is exactly
 * {ODYSSEY}, the cost is 3 or less, and the NAME must not be [Trafalgar Law] (CR 2-1); a card
 * played by an effect pays no cost; "up to 1" may be 0 (CR 8-4-4-1); a returned card is a new card
 * in hand (effects on it are gone, CR 3-1-6).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  chars,
  choices,
  don,
  hand,
  kind,
  L9,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  pickInst,
  play,
  S9,
  yes,
  type Place,
} from './kit-op09a.ts';

const LAW = 'OP09-030';
const LIM = S9.limBlocker; // OP03-015: Red, cost 3, 2000, {ODYSSEY}
const LUCCI = S9.lucci; // OP09-038: Green, cost 4, 6000, {ODYSSEY}

function start(own: Place[], extraHand: string[], p2: Place[] = []): TestGame {
  const g = mine(L9.luffy, { hand: [LAW, ...extraHand], characters: own }, { characters: p2 });
  play(g, g.find('p1', 'hand', LAW));
  return g;
}

describe('OP09-030 Trafalgar Law: [On Play] you may return 1 of my Characters to hand: play up to 1 {ODYSSEY} Character (cost ≤3, not [Trafalgar Law]) from hand', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = start([], []);
    if (kind(g) === 'optional') no(g, 'p1');
    const l = at(g, 'p1', 'characters', LAW);
    expect(g.card(l).cost).toBe(3);
    expect(g.power(l)).toBe(4000);
    expect(g.card(l).counter).toBe(1000);
  });

  it('return another Character to hand, then play the chosen {ODYSSEY} card for free', () => {
    const g = start([S9.c2], [LIM]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LIM]);
    pickCards(g, [LIM]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([LAW, LIM].sort());
    expect(hand(g)).toEqual([S9.c2]);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 }); // only Law's 3; Lim was free
  });

  it('Law himself may be the Character returned (he is on the field when the cost is paid)', () => {
    const g = start([S9.c2], [LIM]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [at(g, 'p1', 'characters', LAW), at(g, 'p1', 'characters', S9.c2)].sort(),
    );
    pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    need(g, 'choose', 'p1');
    pickCards(g, [LIM]);
    expect(chars(g)).toEqual([S9.c2, LIM].sort());
    expect(hand(g)).toEqual([LAW]);
  });

  it('with Law as the only Character the cost has one possible card: it is returned (no pick may be asked) and the play question follows', () => {
    const g = start([], [LIM]);
    yes(g, 'p1');
    const law = g.zone('p1', 'characters').find((c) => c.card === LAW)?.instance;
    if (law && kind(g) === 'choose' && choices(g).includes(law)) pickInst(g, [law]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toContain(LAW);
    pickCards(g, [LIM]);
    expect(chars(g)).toEqual([LIM]);
  });

  it('"you may": declining returns nothing and plays nothing', () => {
    const g = start([S9.c2], [LIM]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([LAW, S9.c2].sort());
    expect(hand(g)).toEqual([LIM]);
  });

  it('boundary: cost 3 is offered, cost 4 is not; non-{ODYSSEY} cards are not offered', () => {
    const g = start([S9.c2], [LIM, LUCCI, S9.c3]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LIM]);
  });

  it('"other than [Trafalgar Law]": a second copy of Law in hand is not offered', () => {
    const g = start([S9.c2], [LAW, LIM]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LIM]);
  });

  it('a Law returned as the cost is not a legal play either (same name)', () => {
    const g = start([S9.c2], [LIM]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toContain(LAW);
    expect(offeredIds(g)).toEqual([LIM]);
  });

  it('with nothing playable in hand the "up to 1" question is still asked, empty (it must not reveal my hand)', () => {
    const g = start([S9.c2], [S9.c3]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S9.c2, S9.c3].sort());
  });

  it('"up to 1": after paying I may play nothing; the returned card stays in hand', () => {
    const g = start([S9.c2], [LIM]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([LAW]);
    expect(hand(g)).toEqual([LIM, S9.c2].sort());
  });

  it('only my own Characters can be returned (not the opponent’s)', () => {
    const g = start([S9.c2], [LIM], [S9.c3]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p2', 'characters', S9.c3));
    expect(choices(g)).toHaveLength(2);
  });

  it('only one card is played even with two qualifying cards in hand', () => {
    const g = start([S9.c2], [LIM, LIM]);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', S9.c2)]);
    pickCards(g, [LIM]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([LAW, LIM].sort());
    expect(hand(g)).toEqual([LIM, S9.c2].sort());
  });
});
