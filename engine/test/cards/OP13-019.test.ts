/** OP13-019 But Ace Here Said You Deserved It!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  none,
  pick,
  play,
  takeDamage,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-019';

describe('OP13-019 But Ace Here Said You Deserved It!!', () => {
  const start = (p2: string[], p1 = {}) => mk({ hand: [ID], ...p1 }, { characters: p2 });
  const theirs = (g: ReturnType<typeof mk>) => g.zone('p2', 'characters').map((c) => c.card);

  it('[Main]: rests 4 DON!!, gives -3000 to an opposing Character, then K.O.s up to 1 with 3000 power or less (the lowered one qualifies)', () => {
    const g = start([V.c4, V.c7]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c4)]); // 6000 -> 3000
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    // Only the 3000 Character qualifies, the 9000 one does not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(theirs(g)).toEqual([V.c7]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 }); // 1 for the Event + 4
  });

  it("boundary: 3000 or less after the -3000; a 4000 Character is not K.O.'d, an untouched 3000 one is", () => {
    const g = start([V.c5, V.c1]); // 7000 -> 4000 after -3000; V.c1 is 3000 as is
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(theirs(g)).toEqual([V.c5]);
  });

  it('"up to 1" in both halves: may skip either; "Then" does not need the first to have happened', () => {
    const g = start([V.c1]);
    play(g, ID);
    accept(g);
    none(g); // no -3000
    pick(g, [g.find('p2', 'characters', V.c1)]); // 3000 or less: still K.O.'d
    expect(theirs(g)).toEqual([]);
    const h = start([V.c1]);
    play(h, ID);
    accept(h);
    pick(h, [h.find('p2', 'characters', V.c1)]);
    none(h); // the second half skipped too
    expect(h.power(h.find('p2', 'characters', V.c1))).toBe(0);
    expect(theirs(h)).toEqual([V.c1]);
  });

  it('declining the optional cost: the Event is played but neither effect happens and no DON!! is rested', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expect(theirs(g)).toEqual([V.c1]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });

  it('needs 4 more DON!! to rest: with only 3 left after paying the Event, the effect is not available', () => {
    const g = start([V.c1], { costArea: { active: 4, rested: 6 } });
    play(g, ID);
    // The offer is shown with its cost unpayable: it cannot be accepted, only declined.
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(theirs(g)).toEqual([V.c1]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    const h = start([V.c1], { costArea: { active: 5, rested: 5 } });
    play(h, ID);
    accept(h);
    pick(h, [h.find('p2', 'characters', V.c1)]);
    expect(don(h, 'p1')).toMatchObject({ active: 0 });
  });

  it('[Counter]: your Leader gains +3000 power during this battle, and only then', () => {
    const g = counterStep({ leader: 'ST01-001', hand: [ID], costArea: { active: 3, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expectDecision(g, 'counter', 'p1');
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
