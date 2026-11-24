/**
 * EB03-022 Isuka (Character, Blue, cost 6, 6000, Counter +1000, {Navy}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Place up to 1 Character with a cost of 4 or less at the bottom of the
 * owner's deck."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4-4-1 ("up to"), the target is any Character (the text has no
 * "your" or "your opponent's"), placed at the bottom of its OWNER's deck, which is not a K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  BLUE,
  chr,
  deck,
  donOf,
  kind,
  LA,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SA,
  theirs,
  zoneIds,
} from './kit-eb03a.ts';

const ISUKA = 'EB03-022';

function play(own: string[], p2: string[]) {
  const g = mine(
    LA.croc,
    { hand: [ISUKA], characters: own, deck: Array(15).fill(BLUE) },
    { characters: p2, deck: Array(10).fill(SA.komachiyo) },
  );
  playRaw(g, ISUKA);
  return g;
}

describe('EB03-022 Isuka: printed values and [Blocker]', () => {
  it('cost 6, 6000, Counter +1000, [Blocker]', () => {
    const g = mine(LA.croc, { characters: [ISUKA] });
    const i = chr(g, 'p1', ISUKA);
    expect(g.card(i).cost).toBe(6);
    expect(g.power(i)).toBe(6000);
    expect(g.card(i).counter).toBe(1000);
    expect(g.card(i).keywords).toContain('Blocker');
  });

  it('blocks an attack on my Leader', () => {
    const g = theirs(LA.croc, { characters: [ISUKA] }, { characters: [SA.sai] });
    attack(g, chr(g, 'p2', SA.sai), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', ISUKA)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', ISUKA) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ISUKA]);
  });
});

describe("EB03-022 Isuka: [On Play] place up to 1 Character with a cost of 4 or less at the bottom of the owner's deck", () => {
  it('offers any Character with cost 4 or less on either field (4 allowed, 5 and Isuka herself not)', () => {
    const g = play([SA.sai, SA.kingdew], [SA.hajrudin, SA.marco, SA.thatch]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.hajrudin, SA.marco, SA.sai].sort());
  });

  it("an opposing Character goes to the bottom of the opponent's deck", () => {
    const g = play([], [SA.hajrudin]);
    pickInst(g, [chr(g, 'p2', SA.hajrudin)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(deck(g, 'p2')).toHaveLength(11);
    expect(deck(g, 'p2').at(-1)).toBe(SA.hajrudin);
    expect(deck(g, 'p1')).toHaveLength(15);
    expect(kind(g)).toBe('main');
  });

  it("my own Character goes to the bottom of MY deck (the owner's)", () => {
    const g = play([SA.sai], [SA.hajrudin]);
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ISUKA]);
    expect(deck(g, 'p1')).toHaveLength(16);
    expect(deck(g, 'p1').at(-1)).toBe(SA.sai);
    expect(deck(g, 'p2')).toHaveLength(10);
  });

  it('boundary: a cost-4 Character is placed; a cost-5 Character is not offered', () => {
    const g = play([], [SA.hajrudin, SA.kingdew]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.hajrudin]);
  });

  it('"up to 1": may place nothing', () => {
    const g = play([SA.sai], [SA.hajrudin]);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SA.sai, ISUKA].sort());
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.hajrudin]);
  });

  it('places at most 1 even with several candidates', () => {
    const g = play([SA.sai], [SA.hajrudin, SA.marco]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it("the placed Character is not K.O.'d: nothing reaches the trash", () => {
    const g = play([], [SA.hajrudin]);
    pickInst(g, [chr(g, 'p2', SA.hajrudin)]);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('with no Character of cost 4 or less nothing is placed and nothing remains pending', () => {
    const g = play([SA.kingdew], [SA.thatch]);
    // With no candidate the pick is skipped or asked empty: both leave nothing placed.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.thatch]);
    expect(kind(g)).toBe('main');
  });

  it("DON!! given to the placed Character goes back to its owner's cost area, rested", () => {
    const g = mine(
      LA.croc,
      {
        hand: [ISUKA],
        characters: [{ card: SA.sai, don: 2 }],
        costArea: { active: 8, rested: 0 },
        deck: Array(15).fill(BLUE),
      },
      {},
    );
    playRaw(g, ISUKA);
    need(g, 'choose', 'p1');
    const before = donOf(g, 'p1');
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    expect(donOf(g, 'p1')).toMatchObject({ given: 0, rested: before.rested + 2 });
  });
});
