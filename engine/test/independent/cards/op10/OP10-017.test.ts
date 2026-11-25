/**
 * OP10-017 Rock (Character, Red, cost 2, 3000, Counter +1000, {Punk Hazard}).
 *
 * Card text: "[On Play] If you don't have [Scotch], play up to 1 [Scotch] from your hand."
 *
 * Rules: the "If" has no colon: an effect condition on my own board, so it does not depend on a
 * hidden card. "Up to 1" may be none; the play is free of cost; [Scotch] is the card named Scotch
 * (OP10-008, [Blocker]); its own [On Play] mirrors this one and sees Rock on the field.
 */
import { describe, expect, it } from 'vitest';
import {
  canFinish,
  cardIds,
  choices,
  don,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const ROCK = 'OP10-017';
const SCOTCH = 'OP10-008';

function start(hand: string[], mineChars: Chars = [], opp = {}) {
  const g = mine('ST01-001', { hand: [ROCK, ...hand], characters: mineChars }, opp);
  playRaw(g, ROCK);
  return g;
}

describe("OP10-017 Rock: [On Play] if you don't have [Scotch], play up to 1 [Scotch] from your hand", () => {
  it('printed values: cost 2, 3000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [ROCK] });
    const c = g.find('p1', 'hand', ROCK);
    expect(g.card(c).cost).toBe(2);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(3000);
  });

  it('without a [Scotch] on my field, a [Scotch] in the hand is played free of cost', () => {
    const g = start([SCOTCH]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCOTCH]);
    pickCards(g, [SCOTCH]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([ROCK, SCOTCH].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(kind(g)).toBe('main');
  });

  it('the played [Scotch] has its printed [Blocker]', () => {
    const g = start([SCOTCH]);
    pickCards(g, [SCOTCH]);
    const s = g.find('p1', 'characters', SCOTCH);
    expect(g.card(s).keywords).toContain('Blocker');
  });

  it('only a card named [Scotch] is offered', () => {
    const g = start([SCOTCH, V10.mochaPh4, VAN.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCOTCH]);
  });

  it('"up to 1": may play none, the [Scotch] stays in the hand', () => {
    const g = start([SCOTCH]);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ROCK]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([SCOTCH]);
  });

  it('at most 1 [Scotch] is played when two are in the hand', () => {
    const g = start([SCOTCH, SCOTCH]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCOTCH]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === SCOTCH)).toHaveLength(1);
    expect(cardIds(g, 'p1', 'hand')).toEqual([SCOTCH]);
  });

  it('with no [Scotch] in the hand the pick is still asked (it must not depend on the hidden hand)', () => {
    const g = start([VAN.marco]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    g.act({ type: 'done' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([ROCK]);
  });

  it('boundary: with a [Scotch] already on my field the condition fails: nothing is asked, none is played', () => {
    const g = start([SCOTCH], [SCOTCH]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([SCOTCH]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === SCOTCH)).toHaveLength(1);
  });

  it('a rested [Scotch] still counts as "have"', () => {
    const g = start([SCOTCH], [{ card: SCOTCH, rested: true }]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([SCOTCH]);
  });

  it('only my own field counts: a [Scotch] controlled by the opponent does not stop the play', () => {
    const g = start([SCOTCH], [], { characters: [SCOTCH] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCOTCH]);
  });

  it('the played [Scotch] sees Rock on the field: its own [On Play] plays no second Rock', () => {
    const g = start([SCOTCH, ROCK]);
    need(g, 'choose', 'p1');
    pickCards(g, [SCOTCH]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([ROCK]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([ROCK, SCOTCH].sort());
  });
});
