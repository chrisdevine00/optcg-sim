/**
 * OP12-102 Shirahoshi (Character, Yellow, cost 2, 0 power, Counter +1000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "If your Character with a base cost of 6 or less would be removed from the field by your
 * opponent's effect, you may turn 1 card from the top of your Life cards face-up instead.
 * [Opponent's Turn] If you have no other [Shirahoshi] with a base cost of 2, all of your "Neptunian"
 * type Characters gain +2000 power."
 *
 * Rules: a replacement effect applies "instead" of the removal (CR 8-1-3-1), only for effects of the
 * opponent (a battle K.O. is not an effect), "you may" (the owner decides), the base cost is the
 * printed cost. The opposing removal used is OP11-018 Honesty Impact ([Main] -4000 power, Then K.O. up
 * to 1 Character with 6000 power or less), whose -4000 lets any Character be K.O.'d whatever its cost.
 * The [Opponent's Turn] part gives the Neptunian bonus only on the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  decision,
  isMain,
  kind,
  LDR,
  mine,
  need,
  no,
  passBlock,
  passCounter,
  pickCards,
  playRaw,
  SC3,
  SCN,
  theirs,
  trash,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-102';
const BOMB = 'OP11-018';
/** OP02-051 Emporio.Ivankov: cost 7, 7000 (a Character with a base cost of 7). */
const COST7 = SC3.ra7;
/** OP11-033 Bird Neptunian: cost 6, 7000, {Neptunian}. */
const COST6 = SC3.nept6b;

/** p2 plays Honesty Impact: -4000 on `reduce`, then K.O. on `ko` (card ids of my Characters). */
function bomb(
  mineChars: string[],
  reduce: string,
  ko: string,
  life: string[] = [SCN.c1, SCN.c2, SCN.c3],
) {
  const g = theirs(LDR.neutral, { characters: mineChars, life }, { hand: [BOMB] });
  playRaw(g, BOMB);
  need(g, 'choose', 'p2');
  pickCards(g, [reduce]);
  need(g, 'choose', 'p2');
  pickCards(g, [ko]);
  return g;
}

describe('OP12-102 Shirahoshi: replace the removal of a base-cost <= 6 Character with turning my top Life face-up', () => {
  it('a base-cost-6 Character K.O.d by the opponent: I am asked, and accepting turns the top Life card face-up instead', () => {
    const g = bomb([ID, COST6], COST6, COST6);
    need(g, 'optional', 'p1');
    yes(g);
    expect(chars(g)).toEqual([ID, COST6].sort());
    expect(trash(g)).toEqual([]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(3);
  });

  it('"you may": declining lets the removal happen and leaves the Life cards face-down', () => {
    const g = bomb([ID, COST6], COST6, COST6);
    need(g, 'optional', 'p1');
    no(g);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([COST6]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('boundary: a Character with a base cost of 7 is not protected and is simply K.O.d', () => {
    const g = bomb([ID, COST7], COST7, COST7);
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([COST7]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('Shirahoshi herself (base cost 2) is protected by her own effect', () => {
    const g = bomb([ID, COST6], ID, ID);
    need(g, 'optional', 'p1');
    yes(g);
    expect(chars(g)).toEqual([ID, COST6].sort());
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('a battle K.O. is not an effect: no offer, the rested Character is K.O.d', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID, { card: COST6, rested: true } as never], life: [SCN.c1, SCN.c2, SCN.c3] },
      { characters: [SCN.c8] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c8), at(g, 'p1', 'characters', COST6));
    passBlock(g);
    passCounter(g);
    expect(decision(g)?.kind).not.toBe('optional');
    expect(trash(g)).toEqual([COST6]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('with no Life card there is nothing to turn face-up: no offer, the Character is K.O.d', () => {
    const g = bomb([ID, COST6], COST6, COST6, []);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([COST6]);
  });

  it('without Shirahoshi on the field the Character is not protected', () => {
    const g = bomb([COST6], COST6, COST6);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([COST6]);
  });

  it('an opposing Shirahoshi does not protect my Characters', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [COST6], life: [SCN.c1] },
      { hand: [BOMB], characters: [ID] },
    );
    playRaw(g, BOMB);
    pickCards(g, [COST6]);
    pickCards(g, [COST6]);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([COST6]);
  });
});

describe('OP12-102 Shirahoshi: any removal by an opposing effect is replaced, not only a K.O.', () => {
  it('OP11-061 placing my base-cost-2 Shirahoshi at the bottom of my deck: I may turn the top Life card face-up instead', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID], life: [SCN.c1, SCN.c2, SCN.c3] },
      { hand: ['OP11-061'] },
      'OP17-039',
    );
    playRaw(g, 'OP11-061');
    need(g, 'choose', 'p2');
    pickCards(g, [ID]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('declining lets her go to the bottom of my deck', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID], life: [SCN.c1, SCN.c2, SCN.c3] },
      { hand: ['OP11-061'] },
      'OP17-039',
    );
    playRaw(g, 'OP11-061');
    pickCards(g, [ID]);
    need(g, 'optional', 'p1');
    no(g);
    expect(chars(g)).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(ID);
  });
});

describe("OP12-102 Shirahoshi: [Opponent's Turn] Neptunian Characters gain +2000 power with no other base-cost-2 Shirahoshi", () => {
  it("on the opponent's turn my Neptunian Characters have +2000 (8000 -> 10000)", () => {
    const g = theirs(LDR.neutral, { characters: [ID, SC3.nept6] }, {});
    expect(isMain(g, 'p2')).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', SC3.nept6))).toBe(10000);
  });

  it('on my own turn there is no bonus', () => {
    const g = mine(LDR.neutral, { characters: [ID, SC3.nept6] });
    expect(g.power(at(g, 'p1', 'characters', SC3.nept6))).toBe(8000);
  });

  it('non-Neptunian Characters are not boosted (Shirahoshi herself stays at 0)', () => {
    const g = theirs(LDR.neutral, { characters: [ID, SCN.c4] }, {});
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(0);
  });

  it('another [Shirahoshi] with a base cost of 2 switches the bonus off', () => {
    const g = theirs(LDR.neutral, { characters: [ID, 'EB01-057', SC3.nept6] }, {});
    expect(g.power(at(g, 'p1', 'characters', SC3.nept6))).toBe(8000);
  });

  it('two copies of this card each see another: neither gives the bonus', () => {
    const g = theirs(LDR.neutral, { characters: [ID, ID, SC3.nept6] }, {});
    expect(g.power(at(g, 'p1', 'characters', SC3.nept6))).toBe(8000);
  });

  it('a [Shirahoshi] with a different base cost (EB03-052, cost 3) does not switch it off', () => {
    const g = theirs(LDR.neutral, { characters: [ID, 'EB03-052', SC3.nept6] }, {});
    expect(g.power(at(g, 'p1', 'characters', SC3.nept6))).toBe(10000);
  });

  it('opposing Neptunian Characters are not boosted', () => {
    const g = theirs(LDR.neutral, { characters: [ID] }, { characters: [SC3.nept6] });
    expect(g.power(at(g, 'p2', 'characters', SC3.nept6))).toBe(8000);
  });
});
