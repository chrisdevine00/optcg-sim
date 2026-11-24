/**
 * OP14-064 Giolla (Character, Purple, cost 3, 1000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On K.O.] Add up to 1 DON!! card from your DON!! deck and rest it. Then, K.O. up to 1
 * of your opponent's Characters with a base power of 0."
 *
 * Rules: CR 10-2-17 ([On K.O.], also after an effect K.O.), "add up to N DON!!" asks a count,
 * "rest it" puts the DON!! in the cost area rested, base power ignores modifiers.
 */
import { describe, expect, it } from 'vitest';
import { koEffect } from '../op15/kit-op15c.ts';
import {
  addDon,
  asksCount,
  at,
  backToMain,
  charState,
  chr,
  countOptions,
  donOf14,
  koGame,
  LD14,
  LIGHTNING,
  mayChooseNone,
  need,
  none,
  offeredIds,
  onField,
  pickInst,
  SC14,
  theirs,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-064';

describe('OP14-064 Giolla [On K.O.] add a rested DON!!, then K.O. a base-0 Character', () => {
  it('asks how many DON!! to add (up to 1); adding 1 puts a RESTED DON!! in the cost area', () => {
    const g = koGame(ID, { p2chars: [SC14.zero1] });
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    const before = donOf14(g);
    addDon(g, 1);
    expect(donOf14(g)).toMatchObject({
      active: before.active,
      rested: before.rested + 1,
      deck: before.deck - 1,
    });
  });

  it('then K.O.s the chosen base-0 Character', () => {
    const g = koGame(ID, { p2chars: [SC14.zero1, SC14.c1] });
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.zero1]);
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    backToMain(g, 'p2');
    expect(charState(g, 'p2')).toBe(`${SC14.zero1}:T,${SC14.c1}:A`);
  });

  it('boundary: base power 1000 and 3000 are not targets, 0 is (two cost values of base 0)', () => {
    const g = koGame(ID, { p2chars: [SC14.zero1, SC14.zero2, SC14.c1, SC14.c2] });
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.zero1, SC14.zero2].sort());
  });

  it('base power: a base-0 Character holding a given DON!! (1000 now) is still a target', () => {
    const g = koGame(ID, { p2chars: [{ card: SC14.zero1, don: 1 }] });
    expect(g.power(chr(g, 'p2', SC14.zero1))).toBe(1000);
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.zero1]);
  });

  it('"up to 1": K.O.s at most one of two base-0 Characters, or none', () => {
    const g = koGame(ID, { p2chars: [SC14.zero1, SC14.zero2] });
    addDon(g, 1);
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    backToMain(g, 'p2');
    expect(charState(g, 'p2')).toBe(`${SC14.zero1}:T,${SC14.zero2}:A`);
    const h = koGame(ID, { p2chars: [SC14.zero1] });
    addDon(h, 1);
    expect(mayChooseNone(h)).toBe(true);
    none(h);
    backToMain(h, 'p2');
    expect(charState(h, 'p2')).toBe(`${SC14.zero1}:A`);
  });

  it('adding none (up to 1) still lets the K.O. be chosen, and no DON!! is added', () => {
    const g = koGame(ID, { p2chars: [SC14.zero1] });
    const before = onField(g);
    addDon(g, 0);
    expect(onField(g)).toBe(before);
    if (asksCount(g)) throw new Error('count asked twice');
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    expect(charState(g, 'p2')).toBe(`${SC14.zero1}:T`);
  });

  it("only the opponent's Characters: my own base-0 Character is not offered", () => {
    const g = koGame(ID, { p1chars: [SC14.zero2], p2chars: [SC14.zero1] });
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.zero1]);
  });

  it('works after an effect K.O. as well (it is an [On K.O.], not a battle trigger)', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { hand: [LIGHTNING], characters: [SC14.zero1], costArea: { active: 9, rested: 0 } },
    );
    koEffect(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.zero1]);
    pickInst(g, [chr(g, 'p2', SC14.zero1)]);
    expect(trash(g)).toEqual([ID]);
    expect(charState(g, 'p2')).toContain(`${SC14.zero1}:T`);
  });

  it('with no base-0 Character on their field the DON!! is still added and the effect ends', () => {
    const g = koGame(ID, { p2chars: [SC14.c1] });
    addDon(g, 1);
    backToMain(g, 'p2');
    expect(charState(g, 'p2')).toBe(`${SC14.c1}:A`);
    expect(donOf14(g).rested).toBe(1);
  });
});
