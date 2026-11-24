/**
 * OP15-004 Sea Cat (Character, Red, cost 1, 0 power, Counter +1000, {Animal}/{Alabasta}).
 *
 * Card text: "[On Play] If your Leader has 0 power or less, give up to 1 of your opponent's
 * Characters -3000 power during this turn."
 *
 * Rules: CR 8-1-2 (the effect is mandatory, "up to" lets the target be skipped), CR 8-4-4-1.
 * API gap (API-GAPS-a.md, G1): no card scripted on file lets a test put a Leader at 0 power or
 * less during its owner's own Main Phase, so the "condition true" branch cannot be reached; the
 * tests pin the false side of the condition and everything around it.
 */
import { describe, expect, it } from 'vitest';
import { at, chr, don, LD15, leaderPower, mine, need, playRaw, SCN } from './kit-op15a.ts';

const SEA_CAT = 'OP15-004';
const SABO = 'OP13-004';

function board(leader: string = LD15.luffy, p2chars: string[] = [SCN.c3, SCN.c5]) {
  return mine(leader, { hand: [SEA_CAT] }, { characters: p2chars });
}

describe('OP15-004 Sea Cat: [On Play] with a Leader at 0 power or less', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'hand', SEA_CAT));
    expect(c.cost).toBe(1);
    expect(c.counter).toBe(1000);
    playRaw(g, SEA_CAT);
    expect(g.power(at(g, 'p1', 'characters', SEA_CAT))).toBe(0);
  });

  it('a 0 power Character is not trashed by the rules: Sea Cat stays on the field', () => {
    const g = board();
    playRaw(g, SEA_CAT);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SEA_CAT]);
  });

  it('with a 5000 power Leader the effect does nothing and asks nothing', () => {
    const g = board();
    expect(leaderPower(g, 'p1')).toBe(5000);
    playRaw(g, SEA_CAT);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(5000);
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('boundary: a Leader at 4000 power (OP13-004 Sabo with 4 Life) is still above 0', () => {
    const g = board(SABO);
    expect(leaderPower(g, 'p1')).toBe(4000);
    playRaw(g, SEA_CAT);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('the cost is exactly 1 DON!!', () => {
    const g = board();
    playRaw(g, SEA_CAT);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });

  it('with no opposing Characters it is simply played', () => {
    const g = board(LD15.luffy, []);
    playRaw(g, SEA_CAT);
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it("the opponent's Leader power is never changed by it", () => {
    const g = board();
    playRaw(g, SEA_CAT);
    expect(leaderPower(g, 'p2')).toBe(5000);
  });
});
