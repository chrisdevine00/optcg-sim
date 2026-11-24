/**
 * OP15-031 Purinpurin (Character, Green, cost 2, 2000, Counter +1000, {Navy}/{East Blue}).
 *
 * Card text: "[On Play] Select up to 1 of your opponent's rested Characters. If the chosen Character
 * has a cost equal to the number of DON!! cards given to it, K.O. it."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-5-5-4 (a K.O.'d card's given DON!! go to its owner's cost area
 * rested). Scenery costs: Alvida 1, Sai 2, Marco 3, Hajrudin 4, Kingdew 5, Thatch 6.
 * Not tested: a cost-0 Character with no DON!! given (no vanilla cost-0 Character exists).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  cardIds,
  chr,
  donW,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  trash,
  W4,
} from './kit-w4a.ts';

const PURIN = 'OP15-031';

type Pl = { card: string; rested?: boolean; don?: number };

function board(p2chars: Pl[]) {
  return mine('ST01-001', { hand: [PURIN] }, { characters: p2chars });
}

describe('OP15-031 Purinpurin: [On Play] K.O. a rested Character whose cost equals its DON!! given', () => {
  it('printed values: cost 2, 2000 power, Counter +1000', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'hand', PURIN));
    expect(c.cost).toBe(2);
    expect(c.counter).toBe(1000);
    playRaw(g, PURIN);
    expect(g.power(chr(g, 'p1', PURIN))).toBe(2000);
  });

  it('K.O.s a rested Character whose cost (3) equals the DON!! given (3)', () => {
    const g = board([{ card: W4.marco, rested: true, don: 3 }]);
    playRaw(g, PURIN);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([W4.marco]);
  });

  it('boundary: one DON!! too few (cost 3, 2 given) does nothing', () => {
    const g = board([{ card: W4.marco, rested: true, don: 2 }]);
    playRaw(g, PURIN);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.marco]);
  });

  it('boundary: one DON!! too many (cost 3, 4 given) does nothing: the match must be exact', () => {
    const g = board([{ card: W4.marco, rested: true, don: 4 }]);
    playRaw(g, PURIN);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.marco]);
  });

  it('a Character with no DON!! given and a cost above 0 is not K.O.d', () => {
    const g = board([{ card: W4.alvida, rested: true }]);
    playRaw(g, PURIN);
    pickInst(g, [chr(g, 'p2', W4.alvida)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.alvida]);
  });

  it('works at other costs: cost 1 with 1 DON!! and cost 5 with 5 DON!! are K.O.d', () => {
    const one = board([{ card: W4.alvida, rested: true, don: 1 }]);
    playRaw(one, PURIN);
    pickInst(one, [chr(one, 'p2', W4.alvida)]);
    expect(cardIds(one, 'p2', 'characters')).toEqual([]);
    const five = board([{ card: W4.kingdew, rested: true, don: 5 }]);
    playRaw(five, PURIN);
    pickInst(five, [chr(five, 'p2', W4.kingdew)]);
    expect(cardIds(five, 'p2', 'characters')).toEqual([]);
  });

  it('the pick offers only RESTED Characters, whatever their cost and DON!!', () => {
    const g = board([
      { card: W4.marco, rested: true, don: 3 },
      { card: W4.kingdew, don: 5 },
      { card: W4.hajrudin, rested: true },
    ]);
    playRaw(g, PURIN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.hajrudin, W4.marco].sort());
  });

  it('"up to 1": may choose nobody, and only one of two matching Characters is K.O.d', () => {
    const g = board([
      { card: W4.marco, rested: true, don: 3 },
      { card: W4.hajrudin, rested: true, don: 4 },
    ]);
    playRaw(g, PURIN);
    need(g, 'choose', 'p1');
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
    const h = board([
      { card: W4.marco, rested: true, don: 3 },
      { card: W4.hajrudin, rested: true, don: 4 },
    ]);
    playRaw(h, PURIN);
    pickInst(h, [chr(h, 'p2', W4.marco)]);
    expect(cardIds(h, 'p2', 'characters')).toEqual([W4.hajrudin]);
  });

  it("the K.O.'d Character's DON!! go back to its owner's cost area rested", () => {
    const g = board([{ card: W4.marco, rested: true, don: 3 }]);
    const before = donW(g, 'p2');
    playRaw(g, PURIN);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(donW(g, 'p2')).toMatchObject({ rested: before.rested + 3, given: 0 });
  });

  it("the opponent's Leader is not a candidate even when rested with DON!!", () => {
    const g = mine(
      'ST01-001',
      { hand: [PURIN] },
      {
        leader: { card: W4.luffy, rested: true, don: 5 },
        characters: [{ card: W4.marco, rested: true, don: 3 }],
      },
    );
    playRaw(g, PURIN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco]);
  });

  it('with no rested Character the effect does nothing and Purinpurin is played', () => {
    const g = board([{ card: W4.marco, don: 3 }]);
    playRaw(g, PURIN);
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      g.act({ type: 'done' });
    }
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.marco]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PURIN]);
  });
});
