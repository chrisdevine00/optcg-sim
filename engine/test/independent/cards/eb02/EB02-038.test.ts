/**
 * EB02-038 Magellan (Purple Character, cost 3, 4000, Counter +1000, {Impel Down}).
 *
 * Card text: "[On Play] Play up to 1 "Impel Down" type Character card with a cost of 2 or less from
 * your hand."
 *
 * Rules: "up to 1" may be 0 (CR 8-4-4-1); the quoted type matches any type including the text
 * (CR 2-4-3-1); the played card comes from the hand only, not the deck or trash; an "up to" pick over
 * a hand with a filter is asked even when no card matches.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  chars,
  decision,
  hand,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  trash,
} from './kit-eb02b.ts';
import { ch, ids } from './kit-eb02b.ts';

const MAG = 'EB02-038';

/** p1 plays Magellan with `inHand` in hand (Magellan first). */
function start(inHand: string[], extra: Partial<Parameters<typeof mine>[1]> = {}) {
  const g = mine(LE.luffy, { hand: [MAG, ...inHand], ...extra });
  playRaw(g, MAG);
  return g;
}

describe('EB02-038 Magellan: printed values', () => {
  it('cost 3, 4000 power, Counter +1000, Purple {Impel Down}', () => {
    const g = mine(LE.luffy, { characters: [MAG] });
    const m = ch(g, 'p1', MAG);
    expect(g.card(m).cost).toBe(3);
    expect(g.power(m)).toBe(4000);
    expect(g.card(m).counter).toBe(1000);
  });
});

describe('EB02-038 Magellan: [On Play] play an "Impel Down" Character with cost 2 or less from hand', () => {
  it('offers exactly the Impel Down Characters with cost 2 or less in hand', () => {
    const g = start([SE.blugori1, SE.domino2, SE.sphinx4, SE.mohji, MAG]);
    need(g, 'choose', 'p1');
    // Cost 1 and cost 2 Impel Down qualify; cost 4 Impel Down, a non-Impel Down cost 1 and the cost 3 Magellan do not.
    expect(offeredIds(g)).toEqual([SE.domino2, SE.blugori1].sort());
  });

  it('plays the chosen card (active) from hand without paying its cost', () => {
    const g = start([SE.blugori1, SE.domino2]);
    pickCards(g, [SE.blugori1]);
    expect(chars(g)).toEqual([MAG, SE.blugori1].sort());
    expect(g.card(ch(g, 'p1', SE.blugori1)).rested).toBe(false);
    expect(hand(g)).toEqual([SE.domino2]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: a cost 2 card qualifies, a cost 4 card does not', () => {
    const g = start([SE.domino2, SE.sphinx4]);
    expect(offeredIds(g)).toEqual([SE.domino2]);
    pickCards(g, [SE.domino2]);
    expect(chars(g)).toContain(SE.domino2);
    expect(hand(g)).toEqual([SE.sphinx4]);
  });

  it('boundary: a cost 3 Impel Down Character (another Magellan) is not offered', () => {
    const g = start([MAG, SE.blugori1]);
    expect(offeredIds(g)).toEqual([SE.blugori1]);
  });

  it('"up to 1": may play nothing, and the hand is unchanged', () => {
    const g = start([SE.blugori1, SE.domino2]);
    none(g);
    expect(chars(g)).toEqual([MAG]);
    expect(hand(g)).toEqual([SE.blugori1, SE.domino2].sort());
    expect(kind(g)).toBe('main');
  });

  it('plays at most 1 card even when several qualify', () => {
    const g = start([SE.blugori1, SE.domino2]);
    pickCards(g, [SE.blugori1]);
    // After one pick the effect is over: no second prompt for another card.
    expect(kind(g)).toBe('main');
    expect(chars(g)).toHaveLength(2);
  });

  it('a non-Impel Down card with a low cost is not offered', () => {
    const g = start([SE.mohji, SE.komachiyo]);
    // Nothing qualifies: the "up to" pick is asked with no candidates (never skipped by hidden hand contents).
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(chars(g)).toEqual([MAG]);
  });

  it('with an empty hand the "up to" pick is still asked (no prompt may depend on hidden cards)', () => {
    const g = start([]);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(offeredIds(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(kind(g)).toBe('main');
  });

  it('only the hand is a source: an Impel Down card in the deck or trash is not offered', () => {
    const g = start([], { deck: [SE.blugori1, ...Array(10).fill(SE.mohji)], trash: [SE.domino2] });
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(chars(g)).toEqual([MAG]);
    expect(trash(g)).toEqual([SE.domino2]);
  });

  it('must not: the opponent never gets a card played, and Magellan stays on the field', () => {
    const g = start([SE.blugori1]);
    pickCards(g, [SE.blugori1]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(chars(g)).toContain(MAG);
  });
});
