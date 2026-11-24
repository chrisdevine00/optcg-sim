/**
 * OP16-022 Monkey.D.Luffy (Leader, Blue/Green, 5000, 4 Life, {Straw Hat Crew}/{Impel Down}, Strike).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If the only Characters on your field are {Impel Down}
 * type Characters, set up to 2 of your DON!! cards as active."
 *
 * Rules: [Once Per Turn] (CR 10-2-13), "up to 2" (CR 8-4-4-1), setting active turns rested DON!!
 * active. M6b-Q21 (answered, by analogy with E-Q4 / QA-OP17 OP17-118): "the only Characters are X"
 * is FALSE when there are no Characters.
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import {
  charIds,
  don,
  endTurn,
  mine,
  OL,
  OV,
  offeredAbilities,
  tryActivate,
  act,
} from './kit-op16a.ts';

const ID1 = 'OP11-064'; // Saldeath: Purple, cost 6, 8000, {Impel Down}, vanilla
const ID2 = 'OP02-084'; // Blugori: Purple, cost 1, 3000, {Animal}/{Impel Down}, vanilla
const ID_MULTI = 'OP16-046'; // Jinbe: Blue, cost 5, 6000, {Fish-Man}/{The Sun Pirates}/{Impel Down}
const NOT_ID = OV.sai4; // Sai: Red, cost 2, 4000, {Happosui Army}

function field(chars: string[], active = 3, rested = 7, p2chars: string[] = []) {
  return mine(
    OL.impel,
    { characters: chars, costArea: { active, rested } },
    { characters: p2chars },
  );
}

describe('OP16-022 Monkey.D.Luffy: [Activate: Main] set up to 2 DON!! as active', () => {
  it('with an {Impel Down} Character as my only Character: sets exactly 2 rested DON!! active', () => {
    const g = field([ID1]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('with several Characters that are all {Impel Down}: still sets 2', () => {
    const g = field([ID1, ID2]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('"a type including": a Character with other types as well as {Impel Down} counts as an {Impel Down} Character', () => {
    const g = field([ID_MULTI, ID1]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('"up to 2": with only 1 rested DON!! it sets 1', () => {
    const g = field([ID1], 9, 1);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });

  it('with no rested DON!! nothing changes', () => {
    const g = field([ID1], 10, 0);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });

  it('does not set more than 2 even with many rested DON!!', () => {
    const g = field([ID1], 0, 10);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('a Character that is not {Impel Down} (alone) stops it: nothing is set active', () => {
    const g = field([NOT_ID]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('boundary: one non-{Impel Down} Character among {Impel Down} Characters stops it', () => {
    const g = field([ID1, ID2, NOT_ID]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it("only my Characters count: an opponent's non-{Impel Down} Character does not stop it", () => {
    const g = field([ID1], 3, 7, [OV.hajrudin6]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('[Once Per Turn]: after one use it is not offered again this turn', () => {
    const g = field([ID1]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('[Once Per Turn] resets: offered again on my next turn', () => {
    const g = field([ID1]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    endTurn(g);
    takeMost(g);
    act(g, { type: 'endTurn' });
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('the Characters are not changed by the effect', () => {
    const g = field([ID1]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(charIds(g, 'p1')).toEqual([ID1]);
  });

  // M6b-Q21 (answered): with NO Characters on the field "the only Characters ... are {Impel Down}
  // Characters" is false (E-Q4 / QA-OP17 OP17-118 precedent), so nothing is set active.
  it('M6b-Q21: with no Characters at all the condition is false and no DON!! is set active', () => {
    const g = field([]);
    tryActivate(g, g.leader('p1'));
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });
});
