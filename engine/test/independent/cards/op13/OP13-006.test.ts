/**
 * OP13-006 Woop Slap (Character, Red, cost 1, 0 power, Counter +1000, {Windmill Village}, Wisdom).
 *
 * Card text: "[On Play] Give up to 2 rested DON!! cards to 1 of your [Monkey.D.Luffy] cards."
 *
 * Rules: "up to 2" is a count the player picks (0 to 2); the recipient is one of my cards named
 * exactly [Monkey.D.Luffy], Leader or Character (CR 8-1-2). A given DON!! is +1000 power on my
 * turn (CR 6-5-5-2). M6b-Q32 (state of a given DON!!) is open: only totals are asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  countOptions,
  don,
  donOn,
  endTurn,
  L13,
  mine,
  need,
  offeredInsts,
  pickCount,
  pickInst,
  playRaw,
  V13,
} from './kit-op13a.ts';

const SLAP = 'OP13-006';

function board(leader: string, chars: string[] = [], costArea = { active: 5, rested: 3 }) {
  return mine(leader, { hand: [SLAP], characters: chars, costArea });
}

describe('OP13-006 Woop Slap: [On Play] give up to 2 rested DON!! to 1 of my [Monkey.D.Luffy] cards', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = board(L13.luffy);
    const c = g.card(at(g, 'p1', 'hand', SLAP));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(1000);
    playRaw(g, SLAP);
    expect(g.power(at(g, 'p1', 'characters', SLAP))).toBe(0);
  });

  it('asks how many (up to 2) and gives that many rested DON!! to my Luffy Leader', () => {
    const g = board(L13.luffy);
    playRaw(g, SLAP);
    need(g, 'choose', 'p1');
    expect([...countOptions(g)].sort()).toEqual([0, 1, 2]);
    const before = don(g);
    pickCount(g, 2);
    need(g, 'main', 'p1');
    expect(donOn(g, g.leader('p1'))).toBe(2);
    expect(don(g)).toMatchObject({ given: 2, rested: before.rested - 2, active: before.active });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('giving 1 gives exactly 1', () => {
    const g = board(L13.luffy);
    playRaw(g, SLAP);
    pickCount(g, 1);
    expect(donOn(g, g.leader('p1'))).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to": 0 is allowed and gives nothing', () => {
    const g = board(L13.luffy);
    playRaw(g, SLAP);
    pickCount(g, 0);
    need(g, 'main', 'p1');
    expect(don(g).given).toBe(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only rested DON!! are given: active DON!! stay active', () => {
    const g = board(L13.luffy, [], { active: 7, rested: 0 });
    playRaw(g, SLAP);
    expect(don(g)).toMatchObject({ active: 6, rested: 1 });
    // Only one rested DON!! exists after the 1-cost payment: at most that one can be given.
    // (The engine may skip the count when only one DON!! can move and ask for the recipient.)
    if (need(g, 'choose', 'p1').purpose === 'mode') pickCount(g, Math.max(...countOptions(g)));
    pickInst(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
    expect(don(g).active).toBe(6);
  });

  it('with a [Monkey.D.Luffy] Leader and a [Monkey.D.Luffy] Character, I choose the recipient', () => {
    const g = board(L13.luffy, [V13.luffy, V13.ace]);
    playRaw(g, SLAP);
    pickCount(g, 2);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1'), at(g, 'p1', 'characters', V13.luffy)].sort());
    pickInst(g, [at(g, 'p1', 'characters', V13.luffy)]);
    expect(donOn(g, at(g, 'p1', 'characters', V13.luffy))).toBe(2);
    expect(donOn(g, g.leader('p1'))).toBe(0);
    expect(g.power(at(g, 'p1', 'characters', V13.luffy))).toBe(8000);
  });

  it('both DON!! go to the same card (1 recipient), never split', () => {
    const g = board(L13.luffy, [V13.luffy]);
    playRaw(g, SLAP);
    pickCount(g, 2);
    pickInst(g, [g.leader('p1')]);
    expect(donOn(g, g.leader('p1'))).toBe(2);
    expect(donOn(g, at(g, 'p1', 'characters', V13.luffy))).toBe(0);
  });

  it('must not: a Leader that is not named Luffy, and other Characters, are never recipients', () => {
    const g = board(L13.shanks, [V13.ace, V13.marco]);
    playRaw(g, SLAP);
    need(g, 'main', 'p1');
    expect(don(g).given).toBe(0);
    expect(donOn(g, g.leader('p1'))).toBe(0);
  });

  it('a Luffy Character alone qualifies when the Leader does not', () => {
    const g = board(L13.shanks, [V13.luffy, V13.ace]);
    playRaw(g, SLAP);
    pickCount(g, 1);
    expect(donOn(g, at(g, 'p1', 'characters', V13.luffy))).toBe(1);
    expect(donOn(g, at(g, 'p1', 'characters', V13.ace))).toBe(0);
    expect(donOn(g, g.leader('p1'))).toBe(0);
  });

  it("the opponent's [Monkey.D.Luffy] Leader is never offered", () => {
    const g = board(L13.luffy, [V13.luffy]);
    playRaw(g, SLAP);
    pickCount(g, 1);
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
  });

  it("the +2000 is on my turn only: at the opponent's turn it is gone", () => {
    const g = board(L13.luffy);
    playRaw(g, SLAP);
    pickCount(g, 2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
