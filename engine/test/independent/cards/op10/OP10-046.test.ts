/**
 * OP10-046 Kyros (Character, Blue, cost 7, 9000, no Counter, {Dressrosa}).
 *
 * Card text: "[On Play] Return up to 1 Character with a cost of 5 or less to the owner's hand."
 *
 * Rules: "Character" with no owner qualifier means either side's, CR 8-1-2 ("up to" may be skipped),
 * a cost of "5 or less" includes 5, the returned card goes to its owner's hand (CR 3-7-1), Leaders are
 * not Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  C10,
  doneRaw,
  expectMain,
  inst,
  L10,
  mine,
  need,
  offeredNow,
  pickRaw,
  playRaw,
  zoneIds,
} from './kit-op10b.ts';

const KYROS = 'OP10-046';

function board(
  p1chars: (string | { card: string; rested: boolean })[] = [],
  p2chars: string[] = [],
) {
  return mine(L10.luffy, { hand: [KYROS], characters: p1chars }, { characters: p2chars });
}

describe("OP10-046 Kyros: [On Play] return up to 1 Character with a cost of 5 or less to its owner's hand", () => {
  it("returns an opposing Character with cost 5 to its owner's hand", () => {
    const g = board([], [C10.kingdew]);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.kingdew));
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.kingdew]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('boundary: a cost-5 Character is offered, a cost-6 one is not', () => {
    const g = board([], [C10.kingdew, C10.thatch]);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.kingdew]);
  });

  it('my own Characters are eligible too, and one returns to MY hand', () => {
    const g = board([C10.marco], [C10.kingdew]);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.kingdew, C10.marco].sort());
    pickRaw(g, inst(g, 'p1', 'characters', C10.marco));
    expect(zoneIds(g, 'p1', 'hand')).toEqual([C10.marco]);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.kingdew]);
  });

  it('Kyros himself (cost 7) is not a candidate', () => {
    const g = board([C10.marco], []);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.marco]);
  });

  it('Leaders are not offered', () => {
    const g = board([C10.marco], [C10.mohji]);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    const offered = offeredNow(g);
    expect(offered).toEqual([C10.marco, C10.mohji].sort());
    for (const i of [g.leader('p1'), g.leader('p2')]) {
      expect(g.legal().some((a) => a.type === 'pick' && a.choice === i)).toBe(false);
    }
  });

  it('"up to 1": choosing nothing returns nothing', () => {
    const g = board([C10.marco], [C10.mohji]);
    playRaw(g, KYROS);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.marco, KYROS].sort());
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });

  it('only one Character returns even when several qualify', () => {
    const g = board([C10.marco], [C10.mohji, C10.kingdew]);
    playRaw(g, KYROS);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.kingdew]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.marco, KYROS].sort());
  });

  it('a rested Character can be returned', () => {
    const g = mine(L10.luffy, { hand: [KYROS] }, { characters: [{ card: C10.sai, rested: true }] });
    playRaw(g, KYROS);
    pickRaw(g, inst(g, 'p2', 'characters', C10.sai));
    expect(zoneIds(g, 'p2', 'hand')).toEqual([C10.sai]);
  });

  it('with no Character of cost 5 or less besides Kyros nothing is returned', () => {
    const g = board([], [C10.thatch]);
    playRaw(g, KYROS);
    if (g.legal().some((a) => a.type === 'done')) doneRaw(g);
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.thatch]);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([]);
  });

  it('Kyros stays on the field with 9000 power', () => {
    const g = board([], [C10.mohji]);
    playRaw(g, KYROS);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(g.power(inst(g, 'p1', 'characters', KYROS))).toBe(9000);
  });
});
