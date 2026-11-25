/**
 * OP10-106 Killer (Character, Yellow, cost 3, 5000, no Counter, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[On K.O.] If your Leader has the "Supernovas" type, look at 3 cards from the top of
 * your deck; reveal up to 1 "Supernovas" or "Kid Pirates" type card and add it to your hand. Then,
 * place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 10-2-17 ([On K.O.], checked when the card is K.O.'d); "up to 1" allows 0; only the top
 * 3 are looked at; the rest go to the bottom in an order the owner picks.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  checkLook,
  deck,
  fill,
  hand,
  kind,
  koGame,
  LD10,
  mine,
  need,
  reachablePickSets,
  SC10,
  SC14,
  tail,
  trash,
} from './kit-op10c.ts';

const ID = 'OP10-106';
const REST = fill(BLUE, 8);

/** p1's Killer is K.O.'d in battle; p1's deck starts with `top`. */
function ko(top: string[], leader: string = LD10.nova) {
  return koGame(ID, { leader, p1: { deck: [...top, ...REST] } });
}

describe('OP10-106 Killer [On K.O.] {Supernovas} Leader: look at 3, add a {Supernovas}/{Kid Pirates} card', () => {
  it('offers only the {Supernovas} / {Kid Pirates} cards of the top 3, and the pick goes to hand', () => {
    const top = [SC10.nova5, SC14.c1, SC10.kid2];
    const g = ko(top);
    expect(trash(g)).toEqual([ID]);
    checkLook(g, { candidates: [SC10.nova5, SC10.kid2], pick: [SC10.kid2] });
    expect(hand(g)).toEqual([SC10.kid2]);
    expect(deck(g)).toHaveLength(10);
    expect(tail(deck(g), 2)).toEqual([SC10.nova5, SC14.c1].sort());
  });

  it('a {Kid Pirates} card that is not a {Supernovas} card qualifies, and so does the reverse', () => {
    const g = ko([SC10.kid2, SC14.c2, SC14.c3]);
    checkLook(g, { candidates: [SC10.kid2], pick: [SC10.kid2] });
    expect(hand(g)).toEqual([SC10.kid2]);
    const h = ko([SC10.nova3r, SC14.c2, SC14.c3]);
    checkLook(h, { candidates: [SC10.nova3r], pick: [SC10.nova3r] });
    expect(hand(h)).toEqual([SC10.nova3r]);
  });

  it('"up to 1": may add nothing; the 3 cards go to the bottom', () => {
    const top = [SC10.nova5, SC10.kid2, SC14.c1];
    const g = ko(top);
    checkLook(g, { candidates: [SC10.nova5, SC10.kid2], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(BLUE);
    expect(tail(deck(g), 3)).toEqual([...top].sort());
  });

  it('adds at most 1 card even when two qualify', () => {
    const g = ko([SC10.nova5, SC10.kid2, SC10.nova3r]);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has(SC10.nova5)).toBe(true);
    expect(sets.has(SC10.kid2)).toBe(true);
    expect(sets.has(SC10.nova3r)).toBe(true);
  });

  it('only the top 3 are looked at: a match in position 4 is not offered', () => {
    const g = ko([SC14.c1, SC14.c2, SC14.c3, SC10.nova5]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([SC14.c1, SC14.c2, SC14.c3].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('with no matching card in the top 3 nothing is added and the 3 go to the bottom', () => {
    const top = [SC14.c1, SC14.c2, SC14.c3];
    const g = ko(top);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([...top].sort());
  });

  it('a Leader that is not {Supernovas}: nothing is looked at, nothing asked, the deck is untouched', () => {
    const top = [SC10.nova5, SC10.kid2, SC14.c1];
    const g = ko(top, LD10.plain);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(deck(g).slice(0, 3)).toEqual(top);
  });

  it('a Leader with the {Supernovas} type among others (Kid Pirates / Supernovas) satisfies the condition', () => {
    const g = ko([SC10.nova5, SC14.c1, SC14.c2], LD10.kid);
    checkLook(g, { candidates: [SC10.nova5], pick: [SC10.nova5] });
    expect(hand(g)).toEqual([SC10.nova5]);
  });

  it('the effect is an [On K.O.]: with Killer merely on the field nothing is asked and the deck is untouched', () => {
    const g = mine(LD10.nova, { characters: [ID], deck: [SC10.nova5, SC14.c1, SC14.c2, ...REST] });
    expect(kind(g)).toBe('main');
    expect(deck(g)).toHaveLength(11);
    expect(hand(g)).toEqual([]);
  });
});
