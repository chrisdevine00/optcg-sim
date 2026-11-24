/**
 * OP15-094 Roronoa Zoro (Character, Black, cost 2, 1000, Counter +1000, {Straw Hat Crew}, [Blocker]).
 *
 * Card text:
 *   "If your {Straw Hat Crew} type Character other than this Character would be removed from the field
 *    by your opponent's effect, you may trash this Character instead.
 *    [Blocker]"
 *
 * Rules relied on: CR 8-1-3-4 / RL-31 (optional replacement), RL-15 (removal covers K.O., return to
 * hand, bottom of deck), CR 10-2-1-1 (a battle K.O. is not an effect), "other than this Character".
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  atMain,
  attack,
  battleKo,
  blockers,
  bottomEffect,
  bounceEffect,
  chars,
  decline,
  hand,
  kind,
  koEffect,
  kw,
  LD15,
  need,
  offered,
  SC15,
  theirsWith,
  trash,
} from './kit-op15c.ts';

const ZORO = 'OP15-094';

const start = (extra: (string | { card: string; rested: boolean })[] = [SC15.shc1, SC15.red3]) =>
  theirsWith(LD15.neutral, { characters: [ZORO, ...extra] });

describe('OP15-094 Roronoa Zoro', () => {
  it('has [Blocker] and can block an attack', () => {
    const g = start();
    expect(kw(g, at(g, 'p1', 'characters', ZORO))).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ZORO)]);
  });

  it('another {Straw Hat Crew} Character K.O.’d by an effect: optional; accepting trashes Zoro and saves it', () => {
    const g = start();
    const sanji = at(g, 'p1', 'characters', SC15.shc1);
    koEffect(g, sanji);
    need(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([SC15.shc1, SC15.red3].sort());
    expect(trash(g)).toEqual([ZORO]);
    expect(g.card(sanji).zone).toBe('characters');
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"may": declining lets the other Character be K.O.’d and Zoro stays', () => {
    const g = start();
    koEffect(g, at(g, 'p1', 'characters', SC15.shc1));
    need(g, 'optional', 'p1');
    decline(g);
    expect(trash(g)).toEqual([SC15.shc1]);
    expect(chars(g)).toEqual([ZORO, SC15.red3].sort());
  });

  it('a Character that is not {Straw Hat Crew} is not covered: no prompt', () => {
    const g = start();
    koEffect(g, at(g, 'p1', 'characters', SC15.red3));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SC15.red3]);
    expect(chars(g)).toContain(ZORO);
  });

  it('"other than this Character": Zoro K.O.’d by an effect is not saved by himself', () => {
    const g = start();
    koEffect(g, at(g, 'p1', 'characters', ZORO));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([ZORO]);
  });

  it('there is no power limit: an 8000-power {Straw Hat Crew} Character returned to hand is covered', () => {
    const g = start([SC15.shc6]);
    const z = at(g, 'p1', 'characters', SC15.shc6);
    bounceEffect(g, z);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(z).zone).toBe('characters');
    expect(trash(g)).toEqual([ZORO]);
    expect(hand(g)).toEqual([]);
  });

  it('placing at the bottom of the deck is also a removal and is covered', () => {
    const g = start([SC15.chopper4]);
    const c = at(g, 'p1', 'characters', SC15.chopper4);
    bottomEffect(g, c);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(c).zone).toBe('characters');
  });

  it('a battle K.O. is not an effect: no prompt, the {Straw Hat Crew} Character is K.O.’d', () => {
    const g = start([{ card: SC15.shc1, rested: true }]);
    battleKo(g, at(g, 'p1', 'characters', SC15.shc1));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SC15.shc1]);
    expect(chars(g)).toEqual([ZORO]);
  });

  it('after Zoro is gone he protects nobody: the next removal of a {Straw Hat Crew} Character has no prompt', () => {
    const g = start([SC15.shc1, SC15.shc3]);
    koEffect(g, at(g, 'p1', 'characters', SC15.shc1));
    accept(g);
    expect(trash(g)).toEqual([ZORO]);
    bounceEffect(g, at(g, 'p1', 'characters', SC15.shc3));
    expect(kind(g)).not.toBe('optional');
    expect(hand(g)).toEqual([SC15.shc3]);
  });
});
