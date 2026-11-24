/** OP14-001 Trafalgar Law (Leader). */
import { describe, expect, it } from 'vitest';
import { expectDecision, pick, V } from './helpers.ts';
import { activate, boost, canPick, HP3, HP6, mk, offeredAb, SN2, SN5 } from './helpers-w4sb.ts';

const ID = 'OP14-001';
const pw = (g: ReturnType<typeof mk>, card: string) => g.power(g.find('p1', 'characters', card));

describe('OP14-001 Trafalgar Law', () => {
  it('[Activate: Main]: swaps the base power of 2 {Supernovas} Characters during this turn', () => {
    const g = mk({ leader: ID, characters: [SN2, SN5] });
    expect([pw(g, SN2), pw(g, SN5)]).toEqual([2000, 5000]);
    activate(g, g.leader('p1'), 'swap');
    pick(g, [g.find('p1', 'characters', SN2)]); // a; b is the only other eligible Character
    expect([pw(g, SN2), pw(g, SN5)]).toEqual([5000, 2000]);
    expectDecision(g, 'main', 'p1');
  });

  it('{Heart Pirates} Characters are eligible, mixed with {Supernovas}; others are not selectable', () => {
    const g = mk({ leader: ID, characters: [HP3, SN5, V.c4] });
    activate(g, g.leader('p1'), 'swap');
    expect(canPick(g, g.find('p1', 'characters', HP3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SN5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p1', 'characters', HP3)]);
    expect([pw(g, HP3), pw(g, SN5), pw(g, V.c4)]).toEqual([5000, 3000, 6000]);
  });

  it('must not fire with fewer than 2 eligible Characters: nothing changes (the use is spent)', () => {
    const g = mk({ leader: ID, characters: [SN2, V.c4, V.c7] });
    activate(g, g.leader('p1'), 'swap');
    expectDecision(g, 'main', 'p1');
    expect([pw(g, SN2), pw(g, V.c4), pw(g, V.c7)]).toEqual([2000, 6000, 9000]);
    expect(offeredAb(g, g.leader('p1'), 'swap')).toBe(false);
  });

  it('reads BASE power: a boost stays with its card and the swapped base is added to it', () => {
    const g = mk({ leader: ID, characters: [SN2, HP6] });
    boost(g, g.find('p1', 'characters', SN2), 3000);
    expect(pw(g, SN2)).toBe(5000);
    activate(g, g.leader('p1'), 'swap');
    pick(g, [g.find('p1', 'characters', SN2)]);
    // SN2: base 6000 (HP6's) + 3000 boost; HP6: base 2000.
    expect([pw(g, SN2), pw(g, HP6)]).toEqual([9000, 2000]);
  });

  it('is Once Per Turn, and the swap ends with the turn', () => {
    const g = mk({ leader: ID, characters: [SN2, SN5] });
    activate(g, g.leader('p1'), 'swap');
    pick(g, [g.find('p1', 'characters', SN2)]);
    expect(offeredAb(g, g.leader('p1'), 'swap')).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect([pw(g, SN2), pw(g, SN5)]).toEqual([2000, 5000]);
    expect(offeredAb(g, g.leader('p1'), 'swap')).toBe(true);
  });
});
