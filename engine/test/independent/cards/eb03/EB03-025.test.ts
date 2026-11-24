/**
 * EB03-025 Hina (Character, Blue, cost 5, 6000, Counter +1000, {Navy}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Return up to 1 Character with 6000 base
 * power to the owner's hand."
 *
 * Rules: CR 8-3-1 (a "you may" cost is optional and all-or-nothing; an unpayable hand cost is offered
 * with accept illegal), CR 8-4-4-1 ("up to"), "base power" ignores effects and given DON!! (RL-33),
 * the target is any Character with exactly 6000 base power (either side, Hina herself included) and it
 * returns to its OWNER's hand.
 */
import { describe, expect, it } from 'vitest';
import {
  chr,
  donOf,
  kind,
  LA,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  reachablePickSets,
  SA,
  unusable,
  yes,
  zoneIds,
} from './kit-eb03a.ts';

const HINA = 'EB03-025';

function play(
  own: (string | { card: string; don?: number })[],
  p2: string[],
  hand: string[] = [SA.mohji],
) {
  const g = mine(LA.croc, { hand: [HINA, ...hand], characters: own }, { characters: p2 });
  playRaw(g, HINA);
  return g;
}

/** Say yes, pay with `card`, and stop at the target pick. */
function pay(g: ReturnType<typeof play>, card: string = SA.mohji) {
  yes(g, 'p1');
  payHand(g, [card]);
}

describe('EB03-025 Hina: printed values', () => {
  it('cost 5, 6000, Counter +1000', () => {
    const g = mine(LA.croc, { characters: [HINA] });
    const h = chr(g, 'p1', HINA);
    expect(g.card(h).cost).toBe(5);
    expect(g.power(h)).toBe(6000);
    expect(g.card(h).counter).toBe(1000);
  });
});

describe("EB03-025 Hina: [On Play] you may trash 1 card from hand: return up to 1 Character with 6000 base power to the owner's hand", () => {
  it("returns an opposing 6000 Character to the opponent's hand", () => {
    const g = play([], [SA.hajrudin]);
    pay(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.hajrudin)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p2', 'hand')).toContain(SA.hajrudin);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('the cost: the chosen hand card is trashed', () => {
    const g = play([], [SA.hajrudin], [SA.mohji, SA.marco]);
    yes(g, 'p1');
    payHand(g, [SA.marco]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([SA.marco]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.mohji]);
  });

  it('offers Characters with exactly 6000 base power on both fields, Hina herself included; 5000 and 7000 are not offered', () => {
    const g = play([SA.hajrudin, SA.marco], [SA.laboon, SA.kingdew, SA.sai]);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HINA, SA.hajrudin, SA.laboon].sort());
  });

  it('my own 6000 Character returns to MY hand', () => {
    const g = play([SA.hajrudin], [SA.laboon]);
    pay(g);
    pickInst(g, [chr(g, 'p1', SA.hajrudin)]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([HINA]);
    expect(zoneIds(g, 'p1', 'hand')).toContain(SA.hajrudin);
    expect(zoneIds(g, 'p2', 'hand')).not.toContain(SA.hajrudin);
  });

  it('Hina may return herself', () => {
    const g = play([], [SA.laboon]);
    pay(g);
    pickInst(g, [chr(g, 'p1', HINA)]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toContain(HINA);
  });

  it('base power is meant: a 5000 Character with 1 DON!! (6000 now) is not offered; a 6000 base with 2 DON!! (8000 now) is', () => {
    const g = mine(LA.croc, {
      hand: [HINA, SA.mohji],
      characters: [
        { card: SA.marco, don: 1 },
        { card: SA.hajrudin, don: 2 },
      ],
      costArea: { active: 7, rested: 0 },
    });
    playRaw(g, HINA);
    pay(g);
    need(g, 'choose', 'p1');
    expect(g.power(chr(g, 'p1', SA.marco))).toBe(6000);
    expect(g.power(chr(g, 'p1', SA.hajrudin))).toBe(8000);
    expect(offeredIds(g)).toEqual([HINA, SA.hajrudin].sort());
  });

  it('"up to 1": may return nothing, and the card is trashed anyway', () => {
    const g = play([], [SA.hajrudin]);
    pay(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.hajrudin]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([SA.mohji]);
  });

  it('returns at most 1 even with several candidates', () => {
    const g = play([SA.hajrudin], [SA.laboon]);
    pay(g);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('"you may": declining the cost trashes nothing and returns nothing', () => {
    const g = play([], [SA.hajrudin]);
    no(g, 'p1');
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.mohji]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.hajrudin]);
    expect(kind(g)).toBe('main');
  });

  it('with an empty hand the cost cannot be paid: nothing is returned', () => {
    const g = play([], [SA.hajrudin], []);
    unusable(g, 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.hajrudin]);
    expect(kind(g)).toBe('main');
  });

  it('DON!! given to the returned Character goes back to the cost area, rested', () => {
    const g = mine(LA.croc, {
      hand: [HINA, SA.mohji],
      characters: [{ card: SA.hajrudin, don: 2 }],
      costArea: { active: 7, rested: 0 },
    });
    playRaw(g, HINA);
    pay(g);
    const before = donOf(g, 'p1');
    expect(before).toMatchObject({ given: 2 });
    pickInst(g, [chr(g, 'p1', SA.hajrudin)]);
    expect(donOf(g, 'p1')).toMatchObject({ given: 0, rested: before.rested + 2 });
    expect(zoneIds(g, 'p1', 'hand')).toContain(SA.hajrudin);
  });
});
