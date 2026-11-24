/**
 * OP13-013 Higuma (Character, Red, cost 1, 3000, no Counter, {Mountain Bandits}, Slash).
 *
 * Card text: "[On Play] K.O. up to 1 of your opponent's Characters with 0 power or less."
 *
 * Rules: "0 power or less" includes negative power; current power is read (OP13-020 Meteor Fist
 * lowers it: its [Main] is "give up to 1 of your opponent's Characters -5000 power during this
 * turn"); "up to 1" may be skipped (CR 8-1-2). A Character is never trashed by the rules for low power.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charsOfIds,
  kind,
  L13,
  mine,
  need,
  none,
  offeredInsts,
  pickInst,
  playRaw,
  trash,
  V13,
  doneRaw,
} from './kit-op13a.ts';

const HIGUMA = 'OP13-013';
const METEOR = 'OP13-020';

function board(p2chars: string[], chars: string[] = [], hand: string[] = [HIGUMA, METEOR]) {
  return mine(
    L13.luffy,
    { hand, characters: chars, costArea: { active: 10, rested: 0 } },
    { characters: p2chars },
  );
}
/** Play Meteor Fist on the opponent's `card` (-5000 this turn). */
function meteorOn(g: ReturnType<typeof board>, card: string) {
  playRaw(g, METEOR);
  need(g, 'choose', 'p1');
  pickInst(g, [at(g, 'p2', 'characters', card)]);
  need(g, 'main', 'p1');
}

describe('OP13-013 Higuma: [On Play] K.O. up to 1 opposing Character with 0 power or less', () => {
  it('printed values: cost 1, 3000, no Counter', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'hand', HIGUMA));
    expect(c.cost).toBe(1);
    expect(c.counter ?? null).toBeNull();
    playRaw(g, HIGUMA);
    expect(g.power(at(g, 'p1', 'characters', HIGUMA))).toBe(3000);
  });

  it('offers only the opposing Character at 0 power and K.O.s it', () => {
    const g = board([V13.cobra0, V13.marco]);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p2', 'characters', V13.cobra0)]);
    pickInst(g, [at(g, 'p2', 'characters', V13.cobra0)]);
    expect(charsOfIds(g, 'p2')).toEqual([V13.marco]);
    expect(trash(g, 'p2')).toEqual([V13.cobra0]);
  });

  it('boundary: a Character reduced to exactly 0 power (Marco 5000 - 5000) is a legal target', () => {
    const g = board([V13.marco, V13.kingdew]);
    meteorOn(g, V13.marco);
    expect(g.power(at(g, 'p2', 'characters', V13.marco))).toBe(0);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p2', 'characters', V13.marco)]);
    pickInst(g, [at(g, 'p2', 'characters', V13.marco)]);
    expect(trash(g, 'p2')).toEqual([V13.marco]);
  });

  it('boundary: 1000 power is above 0 (Hajrudin 6000 - 5000) and is not offered', () => {
    const g = board([V13.hajrudin]);
    meteorOn(g, V13.hajrudin);
    expect(g.power(at(g, 'p2', 'characters', V13.hajrudin))).toBe(1000);
    playRaw(g, HIGUMA);
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(charsOfIds(g, 'p2')).toEqual([V13.hajrudin]);
  });

  it('negative power counts: a Character at -1000 (Sai 4000 - 5000) is a legal target', () => {
    const g = board([V13.sai]);
    meteorOn(g, V13.sai);
    expect(g.power(at(g, 'p2', 'characters', V13.sai))).toBe(-1000);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V13.sai)]);
    expect(trash(g, 'p2')).toEqual([V13.sai]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = board([V13.cobra0]);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    none(g);
    expect(charsOfIds(g, 'p2')).toEqual([V13.cobra0]);
  });

  it('K.O.s at most one even when two Characters qualify', () => {
    const g = board([V13.cobra0, V13.cobra0]);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toHaveLength(2);
    pickInst(g, [at(g, 'p2', 'characters', V13.cobra0)]);
    expect(charsOfIds(g, 'p2')).toEqual([V13.cobra0]);
  });

  it('must not: my own 0-power Character is never offered, nor is the opposing Leader', () => {
    const g = board([V13.cobra0], [V13.cobra0]);
    playRaw(g, HIGUMA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p2', 'characters', V13.cobra0)]);
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
    none(g);
    expect(charsOfIds(g, 'p1').sort()).toEqual([HIGUMA, V13.cobra0].sort());
  });

  it('with no qualifying Character nothing happens and the game continues', () => {
    const g = board([V13.marco, V13.kingdew]);
    playRaw(g, HIGUMA);
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(charsOfIds(g, 'p2')).toEqual([V13.kingdew, V13.marco].sort());
  });

  it('the -5000 is a power change, not a K.O.: Meteor Fist alone leaves the Character on the field', () => {
    const g = board([V13.sai]);
    meteorOn(g, V13.sai);
    expect(charsOfIds(g, 'p2')).toEqual([V13.sai]);
  });
});
