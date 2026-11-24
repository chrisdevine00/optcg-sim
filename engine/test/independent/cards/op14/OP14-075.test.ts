/**
 * OP14-075 Lao.G (Character, Purple, cost 3, 4000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On K.O.] Add up to 1 DON!! card from your DON!! deck and rest it. Then, give up to 1 of
 * your opponent's Characters −2000 power during this turn."
 *
 * Rules: "add up to N DON!!" asks a count; "during this turn" lasts to the end of the current turn
 * (RL-09; the effect is created on the opponent's turn when Lao.G is K.O.'d in their attack); power
 * has no floor (CR 1-3-6-1).
 */
import { describe, expect, it } from 'vitest';
import { koEffect } from '../op15/kit-op15c.ts';
import {
  addDon,
  at,
  backToMain,
  chr,
  countOptions,
  donOf14,
  endTurn,
  koGame,
  LD14,
  LIGHTNING,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickInst,
  SC14,
  theirs,
  trash,
} from './kit-op14c.ts';

const ID = 'OP14-075';

describe('OP14-075 Lao.G [On K.O.] add a rested DON!!, then −2000 power to an opposing Character', () => {
  it('asks how many DON!! (up to 1); adding 1 puts a RESTED DON!! in the cost area', () => {
    const g = koGame(ID, { p2chars: [SC14.c3] });
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    const before = donOf14(g);
    addDon(g, 1);
    expect(donOf14(g)).toMatchObject({
      active: before.active,
      rested: before.rested + 1,
      deck: before.deck - 1,
    });
  });

  it('then gives the chosen opposing Character −2000 power during this turn', () => {
    const g = koGame(ID, { p2chars: [SC14.c3] });
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(5000);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(3000);
    backToMain(g, 'p2');
    expect(trash(g)).toEqual([ID]);
  });

  it('it lasts the turn and no longer: back to 5000 on the next turn', () => {
    const g = koGame(ID, { p2chars: [SC14.c3] });
    addDon(g, 1);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(3000);
    endTurn(g); // p2's turn 4 ends
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(5000);
  });

  it('only opposing Characters are offered: not my own, not their Leader', () => {
    const g = koGame(ID, { p1chars: [SC14.c2], p2chars: [SC14.c3, SC14.c1] });
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1, SC14.c3].sort());
  });

  it('"up to 1": may choose nothing, and then no power changes', () => {
    const g = koGame(ID, { p2chars: [SC14.c3] });
    addDon(g, 1);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(5000);
  });

  it('only one Character gets −2000 when there are two', () => {
    const g = koGame(ID, { p2chars: [SC14.c3, SC14.c4] });
    addDon(g, 1);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(3000);
    expect(g.power(chr(g, 'p2', SC14.c4))).toBe(6000);
  });

  it('power has no floor: a 0-power Character goes to −2000', () => {
    const g = koGame(ID, { p2chars: [SC14.zero2] });
    addDon(g, 1);
    pickInst(g, [chr(g, 'p2', SC14.zero2)]);
    expect(g.power(chr(g, 'p2', SC14.zero2))).toBe(-2000);
  });

  it('adding none (up to 1) still lets me give the −2000, and no DON!! is added', () => {
    const g = koGame(ID, { p2chars: [SC14.c3] });
    const before = donOf14(g);
    addDon(g, 0);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(3000);
    expect(donOf14(g)).toMatchObject({ rested: before.rested, deck: before.deck });
  });

  it('works after an effect K.O. as well', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { hand: [LIGHTNING], characters: [SC14.c3], costArea: { active: 9, rested: 0 } },
    );
    koEffect(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    addDon(g, 1);
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(3000);
    expect(trash(g)).toEqual([ID]);
  });
});
