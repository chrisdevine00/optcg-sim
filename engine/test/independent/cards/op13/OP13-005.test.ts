/**
 * OP13-005 Inazuma (Character, Red, cost 4, 5000, Counter +2000, {Revolutionary Army}, Slash).
 *
 * Card text: "[On Play] Give up to 1 rested DON!! card to your Leader."
 *
 * Rules: CR 8-1-2 ("up to" may be skipped), DON!! given to a card stays under it until the next
 * Refresh Phase, +1000 power per given DON!! in its owner's turn only (CR 6-5-5-2, 6-2-3).
 * M6b-Q32 (state of a given DON!!) is open: tests assert only the cost-area totals, the given
 * count and the power, which every reading shares.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  don,
  donOn,
  endTurn,
  L13,
  mine,
  need,
  none,
  offeredInsts,
  pickInst,
  playRaw,
  toMyNextMain,
  V13,
} from './kit-op13a.ts';

const INAZUMA = 'OP13-005';

function board(costArea = { active: 5, rested: 3 }, chars: string[] = []) {
  return mine(L13.luffy, { hand: [INAZUMA], characters: chars, costArea });
}

describe('OP13-005 Inazuma: [On Play] give up to 1 rested DON!! to my Leader', () => {
  it('printed values: cost 4, 5000, Counter +2000', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'hand', INAZUMA));
    expect(c.cost).toBe(4);
    expect(c.counter).toBe(2000);
    playRaw(g, INAZUMA);
    expect(g.power(at(g, 'p1', 'characters', INAZUMA))).toBe(5000);
  });

  it('offers my Leader as the only recipient, even with other Characters on the field', () => {
    const g = board(undefined, [V13.marco, V13.luffy]);
    playRaw(g, INAZUMA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1')]);
  });

  it('giving: one rested DON!! moves from the cost area to the Leader, +1000 power on my turn', () => {
    const g = board();
    playRaw(g, INAZUMA);
    const before = don(g);
    expect(before.rested).toBe(7); // 3 rested + 4 paid
    pickInst(g, [g.leader('p1')]);
    need(g, 'main', 'p1');
    expect(donOn(g, g.leader('p1'))).toBe(1);
    expect(don(g)).toMatchObject({ given: 1, rested: before.rested - 1, active: before.active });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('only a rested DON!! is given: the active ones stay active', () => {
    const g = board({ active: 6, rested: 0 });
    playRaw(g, INAZUMA);
    expect(don(g)).toMatchObject({ active: 2, rested: 4 });
    pickInst(g, [g.leader('p1')]);
    expect(don(g)).toMatchObject({ active: 2, rested: 3, given: 1 });
  });

  it('"up to 1": the DON!! may be left where it is', () => {
    const g = board();
    playRaw(g, INAZUMA);
    need(g, 'choose', 'p1');
    none(g);
    need(g, 'main', 'p1');
    expect(donOn(g, g.leader('p1'))).toBe(0);
    expect(don(g)).toMatchObject({ given: 0, rested: 7 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('gives exactly one DON!! even when many are rested', () => {
    const g = board({ active: 4, rested: 6 });
    playRaw(g, INAZUMA);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
    expect(donOn(g, g.leader('p1'))).toBe(1);
  });

  it('must not: no Character receives the DON!!, not even Inazuma herself', () => {
    const g = board(undefined, [V13.marco]);
    playRaw(g, INAZUMA);
    pickInst(g, [g.leader('p1')]);
    expect(donOn(g, at(g, 'p1', 'characters', INAZUMA))).toBe(0);
    expect(donOn(g, at(g, 'p1', 'characters', V13.marco))).toBe(0);
  });

  it("the +1000 applies on my turn only: on the opponent's turn the Leader is back to 5000", () => {
    const g = board();
    playRaw(g, INAZUMA);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the given DON!! returns to the cost area at my next Refresh Phase', () => {
    const g = board();
    playRaw(g, INAZUMA);
    pickInst(g, [g.leader('p1')]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(donOn(g, g.leader('p1'))).toBe(0);
    expect(don(g).given).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the opponent's DON!! is not touched", () => {
    const g = board();
    const p2 = don(g, 'p2');
    playRaw(g, INAZUMA);
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p2')).toEqual(p2);
  });
});
