/**
 * OP10-008 Scotch (Character, Red, cost 2, 1000, Counter +1000, {Punk Hazard}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If you don't have [Rock], play up to 1 [Rock] from your hand."
 *
 * Rules: [Blocker] (CR 10-1-1) is a printed keyword (a verified override supplies it). "If you don't
 * have [Rock]" has no colon: an effect condition, checked on the board when the effect resolves, so
 * it does not depend on a hidden card. "Up to 1" may be none; the play is free. Rock (OP10-017) is
 * the card named [Rock]; its own [On Play] mirrors this one and sees Scotch on the field.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  canFinish,
  cardIds,
  choices,
  don,
  kind,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playRaw,
  theirs,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const SCOTCH = 'OP10-008';
const ROCK = 'OP10-017';

function start(hand: string[], mineChars: Chars = [], opp = {}) {
  const g = mine('ST01-001', { hand: [SCOTCH, ...hand], characters: mineChars }, opp);
  playRaw(g, SCOTCH);
  return g;
}

describe("OP10-008 Scotch: [Blocker]; [On Play] if you don't have [Rock], play up to 1 [Rock] from your hand", () => {
  it('printed values: cost 2, 1000, Counter +1000, [Blocker]', () => {
    const g = mine('ST01-001', { hand: [SCOTCH] });
    const c = g.find('p1', 'hand', SCOTCH);
    expect(g.card(c).cost).toBe(2);
    expect(g.card(c).counter).toBe(1000);
    expect(g.card(c).keywords).toContain('Blocker');
  });

  it("[Blocker]: on the opponent's turn it can be declared as the blocker of an attack on my Leader", () => {
    const g = theirs('ST01-001', { characters: [SCOTCH] }, { characters: [VAN.hajrudin] });
    attack(g, at(g, 'p2', 'characters', VAN.hajrudin), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', SCOTCH)]);
    passBlock(g);
  });

  it('without a [Rock] on my field, a [Rock] in the hand is played free of cost', () => {
    const g = start([ROCK]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ROCK]);
    pickCards(g, [ROCK]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SCOTCH, ROCK].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(kind(g)).toBe('main');
  });

  it('only a card named [Rock] is offered', () => {
    const g = start([ROCK, V10.mochaPh4, VAN.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ROCK]);
  });

  it('"up to 1": may play none, the [Rock] stays in the hand', () => {
    const g = start([ROCK]);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SCOTCH]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([ROCK]);
  });

  it('at most 1 [Rock] is played when two are in the hand', () => {
    const g = start([ROCK, ROCK]);
    need(g, 'choose', 'p1');
    pickCards(g, [ROCK]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === ROCK)).toHaveLength(1);
    expect(cardIds(g, 'p1', 'hand')).toEqual([ROCK]);
  });

  it('with no [Rock] in the hand the pick is still asked (it must not depend on the hidden hand)', () => {
    const g = start([VAN.marco]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    g.act({ type: 'done' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([SCOTCH]);
  });

  it('boundary: with a [Rock] already on my field the condition fails: nothing is asked, none is played', () => {
    const g = start([ROCK], [ROCK]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([ROCK]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === ROCK)).toHaveLength(1);
  });

  it('a rested [Rock] still counts as "have"', () => {
    const g = start([ROCK], [{ card: ROCK, rested: true }]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([ROCK]);
  });

  it('only my own field counts: a [Rock] controlled by the opponent does not stop the play', () => {
    const g = start([ROCK], [], { characters: [ROCK] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ROCK]);
  });

  it('the played [Rock] sees Scotch on the field: its own [On Play] plays nothing more', () => {
    const g = start([ROCK, SCOTCH]);
    need(g, 'choose', 'p1');
    pickCards(g, [ROCK]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([SCOTCH]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SCOTCH, ROCK].sort());
  });
});
