/**
 * EB03-005 Sugar (Character, Red, cost 3, 0 power, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] If your Leader is [Sugar], play up to 1 {Donquixote Pirates} type Character
 * card with 6000 power or less from your hand rested."
 *
 * Rules: CR 8-3-3 (conditions), CR 8-4-4-1 ("up to" allows 0), effect plays pay no cost (CR 3-5),
 * "rested" = the card enters the Character area rested. The Leader condition is public, so the
 * prompt must not depend on what the hand holds.
 */
import { describe, expect, it } from 'vitest';
import {
  chr,
  donOf,
  kind,
  LA,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  SA,
  zoneIds,
  finishEmptyPick,
} from './kit-eb03a.ts';

const SUGAR = 'EB03-005';

function start(leader: string, hand: string[], chars: string[] = []) {
  const g = mine(leader, { hand: [SUGAR, ...hand], characters: chars });
  playRaw(g, SUGAR);
  return g;
}

describe('EB03-005 Sugar: printed values', () => {
  it('cost 3, 0 power, Counter +1000', () => {
    const g = mine(LA.sugar, { characters: [SUGAR] });
    const c = chr(g, 'p1', SUGAR);
    expect(g.card(c).cost).toBe(3);
    expect(g.power(c)).toBe(0);
    expect(g.card(c).counter).toBe(1000);
  });
});

describe('EB03-005 Sugar: [On Play] if your Leader is [Sugar], play a {Donquixote Pirates} Character with 6000 power or less from hand rested', () => {
  it('offers exactly the {Donquixote Pirates} Characters with 6000 power or less (6000 is allowed)', () => {
    const g = start(LA.sugar, [SA.baby5, SA.buffalo6, SA.vergo7, SA.hajrudin, SA.guardPoint]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.baby5, SA.buffalo6].sort());
  });

  it('the chosen Character enters rested and its cost is not paid', () => {
    const g = start(LA.sugar, [SA.baby5, SA.buffalo6]);
    const before = donOf(g, 'p1');
    pickCards(g, [SA.buffalo6]);
    const b = chr(g, 'p1', SA.buffalo6);
    expect(g.card(b).rested).toBe(true);
    expect(donOf(g, 'p1')).toEqual(before);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.baby5]);
    expect(kind(g)).toBe('main');
  });

  it('a 7000 {Donquixote Pirates} Character and a non-{Donquixote Pirates} 6000 Character stay in hand', () => {
    const g = start(LA.sugar, [SA.vergo7, SA.hajrudin]);
    finishEmptyPick(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.hajrudin, SA.vergo7].sort());
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": may play nothing', () => {
    const g = start(LA.sugar, [SA.baby5]);
    none(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.baby5]);
  });

  it('plays at most 1 even with two candidates', () => {
    const g = start(LA.sugar, [SA.baby5, SA.buffalo6]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    pickCards(g, [SA.baby5]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR, SA.baby5].sort());
  });

  it('a second copy of Sugar (0 power, {Donquixote Pirates}) is itself a legal candidate', () => {
    const g = start(LA.sugar, [SUGAR, SA.baby5]);
    expect(offeredIds(g)).toEqual([SUGAR, SA.baby5].sort());
  });

  it('with a Leader that is not [Sugar] nothing is played and nothing is asked', () => {
    const g = start(LA.croc, [SA.baby5, SA.buffalo6]);
    expect(kind(g)).toBe('main');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.baby5, SA.buffalo6].sort());
  });

  it('a Sugar Character on the field does not stand in for a [Sugar] Leader', () => {
    const g = start(LA.croc, [SA.baby5], [SUGAR]);
    expect(kind(g)).toBe('main');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR, SUGAR]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.baby5]);
  });

  it('only cards in hand count: a candidate in the trash or deck is not offered', () => {
    const g = mine(LA.sugar, {
      hand: [SUGAR],
      trash: [SA.baby5],
      deck: [SA.buffalo6, SA.mohji, SA.mohji],
    });
    playRaw(g, SUGAR);
    finishEmptyPick(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SUGAR]);
  });
});
