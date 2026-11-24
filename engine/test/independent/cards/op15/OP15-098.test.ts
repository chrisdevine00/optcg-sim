/**
 * OP15-098 Monkey.D.Luffy (Leader, Yellow, 5000, 5 Life, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "If your {Sky Island} type Character with 6000 base power or more would be removed from the
 * field by your opponent, you may add 1 card from the top of your Life cards to your hand instead."
 *
 * Rules relied on: CR 8-1-3-4 / RL-31 (optional replacement; impossible with 0 Life, QA-OP12 OP12-061),
 * RL-15 (removal covers K.O., return to hand, bottom of deck), CR 4-9-2 (base power is the printed
 * power), RD 104 (Life moved outside damage never activates [Trigger]).
 *
 * The wording is "by your opponent" with no "effect". Whether a battle K.O. is covered is an open reading
 * (M6b-Q7 is open for the sibling EB05-061), so no test asserts either way for battle.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  atMain,
  bottomEffect,
  bounceEffect,
  BLUE,
  chars,
  choose,
  decline,
  hand,
  kind,
  koEffect,
  LD15,
  lifeCards,
  mine,
  need,
  offered,
  payDon,
  SC15,
  theirsWith,
  trash,
  unusable,
  act,
  zoneOf,
} from './kit-op15c.ts';

const start = (cardsOnField: string[], life?: string[]) =>
  theirsWith(LD15.skyShc, { characters: cardsOnField, ...(life ? { life } : {}) });

describe('OP15-098 Monkey.D.Luffy (Leader): Sky Island Character with 6000+ base power', () => {
  it('7000-base {Sky Island} Character returned to hand: optional; accepting adds my top Life card to hand and keeps it', () => {
    const g = start([SC15.sky6]);
    const w = at(g, 'p1', 'characters', SC15.sky6);
    bounceEffect(g, w);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(zoneOf(g, w)).toBe('characters');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"may": declining lets the Character return to hand and keeps my Life', () => {
    const g = start([SC15.sky6]);
    bounceEffect(g, at(g, 'p1', 'characters', SC15.sky6));
    need(g, 'optional', 'p1');
    decline(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC15.sky6]);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: exactly 6000 base power (cost 5 Seto) K.O.’d by an effect is covered', () => {
    const g = start([SC15.sky5]);
    const s = at(g, 'p1', 'characters', SC15.sky5);
    koEffect(g, s);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(zoneOf(g, s)).toBe('characters');
    expect(trash(g)).toEqual([]);
  });

  it('boundary: 5000 base power (Genbo) is not covered: no prompt, it is K.O.’d', () => {
    const g = start([SC15.sky3]);
    koEffect(g, at(g, 'p1', 'characters', SC15.sky3));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SC15.sky3]);
    expect(g.life('p1')).toBe(4);
  });

  it('a Character of 8000 base power without the {Sky Island} type is not covered', () => {
    const g = start([SC15.red6]);
    bounceEffect(g, at(g, 'p1', 'characters', SC15.red6));
    expect(kind(g)).not.toBe('optional');
    expect(hand(g)).toEqual([SC15.red6]);
  });

  it('placing at the bottom of the deck is also a removal and is covered', () => {
    const g = start([SC15.sky5]);
    const s = at(g, 'p1', 'characters', SC15.sky5);
    bottomEffect(g, s);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(zoneOf(g, s)).toBe('characters');
  });

  it('with 0 Life cards the replacement cannot be applied: the Character is removed', () => {
    const g = start([SC15.sky6], []);
    bounceEffect(g, at(g, 'p1', 'characters', SC15.sky6));
    unusable(g, 'p1');
    expect(hand(g)).toEqual([SC15.sky6]);
    expect(chars(g)).toEqual([]);
  });

  it('the top Life card goes to hand and its [Trigger] does not activate (RD 104)', () => {
    const g = start([SC15.sky6], [SC15.speed, BLUE, BLUE, BLUE]);
    bounceEffect(g, at(g, 'p1', 'characters', SC15.sky6));
    accept(g);
    expect(hand(g)).toEqual([SC15.speed]);
    expect(chars(g)).toEqual([SC15.sky6]);
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('the opponent’s {Sky Island} Characters are not protected when I remove them', () => {
    const g = mine(LD15.skyShc, { hand: [SC15.lightning] }, { characters: [SC15.sky5] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', SC15.lightning) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 2, 'costRested');
    choose(g, [g.find('p2', 'characters', SC15.sky5)]);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g, 'p2')).toEqual([SC15.sky5]);
  });
});
