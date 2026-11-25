/**
 * OP09-018 Get Out of Here! (Event, Red, cost 3, {Red-Haired Pirates}).
 *
 * Card text: "[Main] K.O. up to 2 of your opponent's Characters with a total power of 4000 or less."
 *
 * Rules: CR 4-8-1 ("up to"), CR 10-2-1 (K.O.: the Character goes to the trash), CR 6-5-5-2 (given
 * DON!! add power only on the owner's turn).
 * Open M6b-Q71 (total of current or printed power): the tests never change a Character's power, so
 * every reading agrees.
 *
 * Scenery (printed): OP01-012 Sai 4000, OP01-010 Komachiyo 3000, OP03-010 Fossa 2000 ([Blocker] only),
 * EB04-046 Doll 1000 ([Blocker] only), EB03-009 Makino 0 power, OP01-023 Marco 5000.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, reachablePickSets, side } from '../kit.ts';
import {
  BLUE,
  LW,
  mayEnd,
  need,
  none,
  offeredCards,
  ofZone,
  pickCards,
  put,
  RED,
  SC6,
} from './kit-w6a.ts';

const ID = 'OP09-018';
const FOSSA = 'OP03-010';
const DOLL = 'EB04-046';
const MAKINO = 'EB03-009';

function start(theirs: PlayerSpec['characters'], mine: PlayerSpec['characters'] = []) {
  return myTurn(
    side(LW.luffy, BLUE, { hand: [ID], costArea: { active: 3, rested: 0 }, characters: mine }),
    side(LW.luffy, RED, { characters: theirs }),
  );
}

const sorted = (...ids: string[]) => ids.slice().sort().join('+');

describe('OP09-018 Get Out of Here!: [Main] K.O. up to 2 opposing Characters with a total power of 4000 or less', () => {
  it('K.O.s two Characters whose powers add up to 4000 or less; the Event is used up', () => {
    const g = start([DOLL, FOSSA, SC6.c5k]);
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [DOLL, FOSSA]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p2', 'characters')).toEqual([SC6.c5k]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([DOLL, FOSSA].sort());
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
  });

  it('every legal selection: total 4000 exactly is allowed (3000+1000), above is not (3000+2000, 4000+1000), 5000 alone is not', () => {
    const g = start([SC6.c4k, SC6.c3k, DOLL, FOSSA, SC6.c5k]);
    put(g, ID);
    const sets = reachablePickSets(g);
    expect([...sets].sort()).toEqual(
      ['', SC6.c4k, SC6.c3k, DOLL, FOSSA, sorted(SC6.c3k, DOLL), sorted(DOLL, FOSSA)].sort(),
    );
  });

  it('a single Character of exactly 4000 power is a legal choice; 5000 is not offered', () => {
    const g = start([SC6.c4k, SC6.c5k]);
    put(g, ID);
    expect(offeredCards(g)).toEqual([SC6.c4k]);
    pickCards(g, [SC6.c4k]);
    expect(ofZone(g, 'p2', 'characters')).toEqual([SC6.c5k]);
  });

  it('at most 2 Characters: three Characters with a total of 3000 or less cannot all be chosen', () => {
    const g = start([DOLL, FOSSA, MAKINO]);
    put(g, ID);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(sets.has(sorted(DOLL, FOSSA))).toBe(true);
    expect(sets.has(sorted(DOLL, MAKINO))).toBe(true);
    expect(sets.has(sorted(DOLL, FOSSA, MAKINO))).toBe(false);
  });

  it('a Character with 0 power adds nothing to the total: 4000 + 0 is legal', () => {
    const g = start([SC6.c4k, MAKINO, SC6.c3k]);
    put(g, ID);
    const sets = reachablePickSets(g);
    expect(sets.has(sorted(SC6.c4k, MAKINO))).toBe(true);
    expect(sets.has(sorted(SC6.c3k, MAKINO))).toBe(true);
    expect(sets.has(sorted(SC6.c4k, SC6.c3k))).toBe(false);
  });

  it('"up to": choosing 1 of 2 candidates, or none, is allowed; none K.O.s nothing but the Event is used', () => {
    const g = start([DOLL, FOSSA]);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(2);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p2', 'characters')).toEqual([DOLL, FOSSA].sort());
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    const h = start([DOLL, FOSSA]);
    put(h, ID);
    pickCards(h, [FOSSA]);
    expect(ofZone(h, 'p2', 'characters')).toEqual([DOLL]);
  });

  it('only opposing Characters can be chosen: my own small Character and the Leaders are not offered', () => {
    const g = start([DOLL], [FOSSA]);
    put(g, ID);
    expect(offeredCards(g)).toEqual([DOLL]);
    pickCards(g, [DOLL]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([FOSSA]);
  });

  it('DON!! given to an opposing Character add no power on my turn, so a 3000 with 2 given DON!! is still a 3000 target', () => {
    const g = start([{ card: SC6.c3k, don: 2 }, DOLL]);
    put(g, ID);
    const sets = reachablePickSets(g);
    expect(sets.has(sorted(SC6.c3k, DOLL))).toBe(true);
  });

  it('no opposing Character: the Event resolves with nothing to K.O. and is trashed', () => {
    const g = start([]);
    put(g, ID);
    if (decision(g)?.kind === 'choose') none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID]);
    expect(ofZone(g, 'p2', 'trash')).toEqual([]);
  });

  it("only Characters with power above 4000 on the opposing field: the pick is asked empty or skipped, and nothing is K.O.'d", () => {
    const g = start([SC6.c5k, SC6.c7k]);
    put(g, ID);
    if (decision(g)?.kind === 'choose') {
      expect(offeredCards(g)).toEqual([]);
      none(g);
    }
    expect(ofZone(g, 'p2', 'characters')).toEqual([SC6.c5k, SC6.c7k].sort());
  });
});
