/**
 * EB03-021 Alvida (Character, Blue, cost 4, 2000, Counter +1000, {Cross Guild}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Place up to 1 of your opponent's Characters
 * with 4000 base power or less and up to 1 Character with a base cost of 3 or less at the bottom of
 * the owner's deck."
 *
 * Rules: CR 8-3-1 (a "you may" cost is optional and all-or-nothing; an unpayable cost from the hidden
 * hand is offered with accept illegal), CR 8-4-4-1 ("up to" each), placing at the bottom is not a K.O.
 * (no [On K.O.]), "base" power/cost ignore effects. The second target has no "of your opponent's": the
 * tests only use opposing Characters for it (whether my own may be chosen is not asserted).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  chr,
  deck,
  donOf,
  kind,
  LA,
  mine,
  need,
  none,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  SA,
  unusable,
  yes,
  no,
  zoneIds,
} from './kit-eb03a.ts';

const ALVIDA = 'EB03-021';

/** p1 plays Alvida with `hand` as the rest of the hand; p2 holds `p2` Characters and a 10-card deck. */
function play(p2: string[], hand: string[] = [SA.mohji], own: string[] = []) {
  const g = mine(
    LA.croc,
    { hand: [ALVIDA, ...hand], characters: own, deck: Array(15).fill(BLUE) },
    { characters: p2, deck: Array(10).fill(SA.komachiyo) },
  );
  playRaw(g, ALVIDA);
  return g;
}

/** Say yes and pay with the (only) filler card; the next prompt is the first target pick. */
function pay(g: ReturnType<typeof play>, card: string = SA.mohji) {
  yes(g, 'p1');
  payHand(g, [card]);
}

describe('EB03-021 Alvida: printed values', () => {
  it('cost 4, 2000, Counter +1000', () => {
    const g = mine(LA.croc, { characters: [ALVIDA] });
    const a = chr(g, 'p1', ALVIDA);
    expect(g.card(a).cost).toBe(4);
    expect(g.power(a)).toBe(2000);
    expect(g.card(a).counter).toBe(1000);
  });
});

describe("EB03-021 Alvida: [On Play] you may trash 1 card: place up to 1 opposing Character (4000 base power or less) and up to 1 Character (base cost 3 or less) at the bottom of its owner's deck", () => {
  it("places both chosen Characters at the bottom of the opponent's deck", () => {
    const g = play([SA.sai, SA.marco, SA.kingdew]);
    pay(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.marco)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.kingdew]);
    const d = deck(g, 'p2');
    expect(d).toHaveLength(12);
    expect(d.slice(-2).sort()).toEqual([SA.marco, SA.sai].sort());
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('the cost: the chosen hand card is trashed', () => {
    const g = play([SA.sai], [SA.mohji, SA.marco]);
    yes(g, 'p1');
    payHand(g, [SA.marco]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([SA.marco]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.mohji]);
  });

  it('first pick: opposing Characters with 4000 base power or less (4000 allowed, 5000 not)', () => {
    const g = play([SA.sai, SA.komachiyo, SA.marco, SA.hajrudin]);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.komachiyo, SA.sai].sort());
  });

  it('second pick: Characters with a base cost of 3 or less (3 allowed, 4 not)', () => {
    const g = play([SA.sai, SA.marco, SA.hajrudin, SA.kingdew]);
    pay(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).toContain(SA.marco);
    expect(offered).not.toContain(SA.hajrudin);
    expect(offered).not.toContain(SA.kingdew);
    // The Character already chosen for the first part cannot be chosen again.
    expect(offered).not.toContain(SA.sai);
  });

  it('a Character with high power but low cost qualifies only for the second part', () => {
    const g = play([SA.marco]);
    pay(g);
    need(g, 'choose', 'p1');
    // The first part has no candidate (Marco has 5000 power): it is skipped or asked empty.
    if (offeredIds(g).length === 0) {
      none(g);
      need(g, 'choose', 'p1');
    }
    expect(offeredIds(g)).toEqual([SA.marco]);
    pickInst(g, [chr(g, 'p2', SA.marco)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(deck(g, 'p2').at(-1)).toBe(SA.marco);
  });

  it('"up to 1" each: the first part may be skipped and only the second used', () => {
    const g = play([SA.sai, SA.marco]);
    pay(g);
    need(g, 'choose', 'p1');
    none(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.marco)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.sai]);
  });

  it('"up to 1" each: the second part may be skipped and only the first used', () => {
    const g = play([SA.sai, SA.marco]);
    pay(g);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.marco]);
  });

  it('"you may": declining the cost trashes nothing and places nothing', () => {
    const g = play([SA.sai, SA.marco]);
    no(g, 'p1');
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.mohji]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.marco, SA.sai].sort());
    expect(kind(g)).toBe('main');
  });

  it('with an empty hand the cost cannot be paid: the effect cannot be used and nothing is placed', () => {
    const g = play([SA.sai, SA.marco], []);
    unusable(g, 'p1');
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.marco, SA.sai].sort());
    expect(kind(g)).toBe('main');
  });

  it('the first part never offers my own Characters', () => {
    const g = play([SA.sai], [SA.mohji], [SA.komachiyo]);
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.sai]);
  });

  it("a placed Character is not K.O.'d: it is not in the trash", () => {
    const g = play([SA.sai]);
    pay(g);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    if (kind(g) === 'choose') none(g);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
    expect(deck(g, 'p2').at(-1)).toBe(SA.sai);
  });

  it("DON!! given to a placed opposing Character returns to the opponent's cost area, rested", () => {
    const g = mine(
      LA.croc,
      { hand: [ALVIDA, SA.mohji], deck: Array(15).fill(BLUE) },
      { characters: [{ card: SA.sai, don: 2 }], costArea: { active: 3, rested: 0 } },
    );
    playRaw(g, ALVIDA);
    pay(g);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    if (kind(g) === 'choose') none(g);
    expect(donOf(g, 'p2')).toMatchObject({ given: 0, active: 3, rested: 2 });
  });
});
