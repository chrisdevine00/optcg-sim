/**
 * ST21-010 Nico Robin (Red Character, cost 3, 4000, Counter +1000, {Straw Hat Crew}).
 * "[DON!! x2] [When Attacking] K.O. up to 1 of your opponent's Characters with 4000 power or less."
 * Rules: [DON!! x2] needs at least 2 DON!! given to Robin; the power limit is checked on the current
 * power; "up to 1" allows choosing nobody; a K.O. sends the Character to the trash.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  inst,
  kind,
  LD,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC,
  settleEmptyChoose,
  trash,
  cost,
} from './kit-st1821a.ts';

const ID = 'ST21-010';
const OPP = [SC.c1, SC.c2, SC.c3, SC.c4];

function start(don: number, opp: string[] = OPP, extra: Partial<PlayerSpec> = {}) {
  return mine(
    LD.luffy,
    { characters: [{ card: ID, don }, ...(extra.characters ?? [])], ...cost(5) },
    { characters: opp },
  );
}

function swing(g: ReturnType<typeof start>) {
  attack(g, inst(g, 'p1', 'characters', ID), g.leader('p2'));
}

describe('ST21-010 Nico Robin: [DON!! x2] [When Attacking] K.O. up to 1 opposing Character with 4000 power or less', () => {
  it('with 2 DON!! given, attacking offers exactly the opposing Characters of 4000 power or less', () => {
    const g = start(2);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c1, SC.c2].sort());
  });

  it('the picked Character is K.O.d and goes to the trash; the others stay', () => {
    const g = start(2);
    swing(g);
    pickCards(g, [SC.c2]);
    expect(trash(g, 'p2')).toEqual([SC.c2]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([SC.c1, SC.c3, SC.c4].sort());
  });

  it('power boundary: 4000 qualifies, 5000 does not', () => {
    const g = start(2, [SC.c2, SC.c3]);
    swing(g);
    expect(offeredIds(g)).toEqual([SC.c2]);
  });

  it('with only 1 DON!! given nothing happens: no prompt and no K.O.', () => {
    const g = start(1);
    swing(g);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('with no DON!! given nothing happens', () => {
    const g = start(0);
    swing(g);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"up to 1": choosing nobody K.O.s nobody', () => {
    const g = start(2);
    swing(g);
    none(g);
    noDefence(g);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('at most 1 Character is K.O.d even when two qualify', () => {
    const g = start(2);
    swing(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no qualifying opposing Character the effect does nothing and the attack goes on', () => {
    const g = start(2, [SC.c3, SC.c4]);
    swing(g);
    settleEmptyChoose(g);
    expect(kind(g)).toBe('block');
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('my own Characters are never offered', () => {
    const g = start(2, OPP, { characters: [SC.c1] });
    swing(g);
    // One of my Mohji (3000) is on the field; only the opposing one is a candidate.
    expect(offeredIds(g)).toEqual([SC.c1, SC.c2].sort());
    pickCards(g, [SC.c1]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([SC.c1, ID].sort());
    expect(trash(g, 'p2')).toEqual([SC.c1]);
  });
});
