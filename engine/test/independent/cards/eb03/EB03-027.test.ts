/**
 * EB03-027 Marguerite (Character, Blue, cost 6, 7000, Counter +1000, {Amazon Lily}).
 *
 * Card text: "[On Play] Return up to 1 Character with 7000 base power to the owner's hand."
 *
 * Rules: CR 8-4-4-1 ("up to"), "base power" ignores effects and given DON!! (RL-33), any Character on
 * either field with exactly 7000 base power qualifies (Marguerite herself too), and it returns to its
 * OWNER's hand (not a K.O., not trashed).
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
  pickInst,
  playRaw,
  reachablePickSets,
  SA,
  zoneIds,
} from './kit-eb03a.ts';

const MARGUERITE = 'EB03-027';

function play(own: (string | { card: string; don?: number })[], p2: string[]) {
  const g = mine(LA.croc, { hand: [MARGUERITE], characters: own }, { characters: p2 });
  playRaw(g, MARGUERITE);
  return g;
}

describe('EB03-027 Marguerite: printed values', () => {
  it('cost 6, 7000, Counter +1000', () => {
    const g = mine(LA.croc, { characters: [MARGUERITE] });
    const m = chr(g, 'p1', MARGUERITE);
    expect(g.card(m).cost).toBe(6);
    expect(g.power(m)).toBe(7000);
    expect(g.card(m).counter).toBe(1000);
  });
});

describe("EB03-027 Marguerite: [On Play] return up to 1 Character with 7000 base power to the owner's hand", () => {
  it("returns an opposing 7000 Character to the opponent's hand", () => {
    const g = play([], [SA.kingdew]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.kingdew)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p2', 'hand')).toContain(SA.kingdew);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('offers Characters with exactly 7000 base power on both fields, Marguerite herself included; 6000 and 8000 are not offered', () => {
    const g = play([SA.vergo7, SA.hajrudin], [SA.kingdew, SA.chakaPell6, SA.thatch, SA.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MARGUERITE, SA.vergo7, SA.kingdew, SA.chakaPell6].sort());
  });

  it('my own 7000 Character returns to MY hand', () => {
    const g = play([SA.vergo7], [SA.sai]);
    pickInst(g, [chr(g, 'p1', SA.vergo7)]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([MARGUERITE]);
    expect(zoneIds(g, 'p1', 'hand')).toContain(SA.vergo7);
    expect(zoneIds(g, 'p2', 'hand')).not.toContain(SA.vergo7);
  });

  it('Marguerite may return herself', () => {
    const g = play([], [SA.sai]);
    pickInst(g, [chr(g, 'p1', MARGUERITE)]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toContain(MARGUERITE);
  });

  it('base power is meant: a 6000 Character with 1 DON!! (7000 now) is not offered; a 7000 base with 1 DON!! (8000 now) is', () => {
    const g = mine(LA.croc, {
      hand: [MARGUERITE],
      characters: [
        { card: SA.hajrudin, don: 1 },
        { card: SA.vergo7, don: 1 },
      ],
      costArea: { active: 8, rested: 0 },
    });
    playRaw(g, MARGUERITE);
    need(g, 'choose', 'p1');
    expect(g.power(chr(g, 'p1', SA.hajrudin))).toBe(7000);
    expect(g.power(chr(g, 'p1', SA.vergo7))).toBe(8000);
    expect(offeredIds(g)).toEqual([MARGUERITE, SA.vergo7].sort());
  });

  it('"up to 1": may return nothing', () => {
    const g = play([], [SA.kingdew]);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.kingdew]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([MARGUERITE]);
  });

  it('returns at most 1 even with several candidates', () => {
    const g = play([SA.vergo7], [SA.kingdew]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('there is no cost: no hand card is trashed', () => {
    const g = mine(LA.croc, { hand: [MARGUERITE, SA.mohji] }, { characters: [SA.kingdew] });
    playRaw(g, MARGUERITE);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.kingdew)]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.mohji]);
  });

  it('a Character with 8000 base power is untouched', () => {
    const g = play([], [SA.thatch]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(SA.thatch);
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.thatch]);
  });

  it('DON!! given to my returned Character goes back to the cost area, rested', () => {
    const g = mine(LA.croc, {
      hand: [MARGUERITE],
      characters: [{ card: SA.vergo7, don: 1 }],
      costArea: { active: 9, rested: 0 },
    });
    playRaw(g, MARGUERITE);
    need(g, 'choose', 'p1');
    const before = donOf(g, 'p1');
    pickInst(g, [chr(g, 'p1', SA.vergo7)]);
    expect(donOf(g, 'p1')).toMatchObject({ given: 0, rested: before.rested + 1 });
  });
});
