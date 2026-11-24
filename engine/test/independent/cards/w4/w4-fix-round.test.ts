/**
 * Wave 4 fix round (docs/reviews/m6b-wave4.md, W4-R3 to W4-R6): readings that are open or that the
 * review found unpinned. Each test states the reading the engine takes today, so a later ruling
 * changes it on purpose (one line), not by accident.
 *
 * - W4-R3 (M6b-Q51): two OP14-017 swaps on the same pair end at 9000 / 9000, not exchanged back.
 * - W4-R4 (OP15-001 reading): with no Characters on the field the "only {East Blue}" aura is off.
 * - W4-R5 (M6b-Q55): OP15-008 reduces each opposing Character by the DON!! given to THAT Character.
 */
import { describe, expect, it } from 'vitest';
import { chr, mine, need, pickInst, playRaw, powerOf, trash, W, LW } from './kit-w4b.ts';
import { giveDonFlow, theirsW, useAbility, W4 } from './kit-w4a.ts';

describe('W4-R3 (M6b-Q51): chained base-power swaps on the same pair', () => {
  it('a second Chambres on the same two Characters leaves both at the larger value', () => {
    const g = mine(
      LW.luffy,
      { hand: ['OP14-017', 'OP14-017'], costArea: { active: 10, rested: 0 } },
      { characters: [W.oars9, W.bepo] },
    );
    const chambres = () => {
      playRaw(g, 'OP14-017');
      need(g, 'choose', 'p1');
      pickInst(g, [chr(g, 'p2', W.oars9)]);
      if (g.legal().some((a) => a.type === 'pick')) pickInst(g, [chr(g, 'p2', W.bepo)]);
    };
    chambres();
    expect([powerOf(g, 'p2', W.oars9), powerOf(g, 'p2', W.bepo)]).toEqual([3000, 9000]);
    chambres();
    // Each swap is one more base-power setting and the highest setting wins (M6b-Q51): the second
    // swap cannot take the first back. A ruling that a swap replaces the earlier one changes this.
    expect([powerOf(g, 'p2', W.oars9), powerOf(g, 'p2', W.bepo)]).toEqual([9000, 9000]);
  });
});

describe('W4-R4: OP15-001 Krieg with no Characters on the field', () => {
  it('"the only Characters on your field are {East Blue}" is not true of an empty field: no -2000', () => {
    const g = theirsW(
      { leader: { card: 'OP15-001', don: 1 }, characters: [] },
      { characters: [W4.marco, W4.kingdew] },
    );
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(7000);
  });

  it('control: one {East Blue} Character turns the same aura on', () => {
    const g = theirsW(
      { leader: { card: 'OP15-001', don: 1 }, characters: [W4.alvida] },
      { characters: [W4.marco, W4.kingdew] },
    );
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(3000);
  });
});

describe('W4-R5 (M6b-Q55): OP15-008 per-target reading with different given DON!!', () => {
  it('each opposing Character gets -1000 per DON!! given to itself (Kingdew 2, Marco 1, Sai 0)', () => {
    const g = mine(
      'ST01-001',
      { hand: ['OP15-008'] },
      {
        characters: [{ card: W4.kingdew, don: 1 }, { card: W4.marco, don: 1 }, W4.sai],
        costArea: { active: 0, rested: 4 },
      },
    );
    playRaw(g, 'OP15-008');
    giveDonFlow(g, 1, chr(g, 'p2', W4.kingdew)); // Kingdew now holds 2
    useAbility(g, chr(g, 'p1', 'OP15-008'));
    // Per target: 7000 - 2000, 5000 - 1000, 4000 - 0. The rival reading (every Character gets the
    // count of the one that was given DON!!) would give 5000 / 3000 / 2000.
    expect(g.power(chr(g, 'p2', W4.kingdew))).toBe(5000);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(4000);
    expect(g.power(chr(g, 'p2', W4.sai))).toBe(4000);
  });
});

describe('W4-R6 (M6b-Q5): EB04-044 Koby and the Character-area overflow trash', () => {
  it('Koby chosen for the sixth-Character trash is trashed with no replacement offer (CR 3-7-6-1-1)', () => {
    const g = mine(
      LW.sakazuki,
      {
        hand: [W.thatch, W.marco],
        characters: ['EB04-044', W.sai, W.hajrudin, W.kingdew, W.komachiyo],
        costArea: { active: 10, rested: 0 },
      },
      {},
    );
    playRaw(g, W.thatch);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickInst(g, [chr(g, 'p1', 'EB04-044')]);
    // The rule trash is rule processing, not an effect: no "instead" is offered and Koby is gone.
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(trash(g, 'p1')).toEqual(['EB04-044']);
  });
});
