/** OP09-007 Heat. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canBlockWith, canPick, mk, p2Attacks, shrinkLeader } from './helpers-a09g1.ts';

const ID = 'OP09-007';

describe('OP09-007 Heat', () => {
  it('[On Play]: a Leader with 4000 power or less gains +1000 power during this turn', () => {
    const g = mk({ hand: [ID] });
    shrinkLeader(g, 'p1', 1000); // 4000
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000); // both modifiers are gone: back to the printed 5000
  });

  it('boundary: 4000 and 3000 qualify, 4500 and 5000 do not (no choice is asked)', () => {
    for (const [lower, ok] of [
      [1000, true],
      [2000, true],
      [500, false],
      [0, false],
    ] as const) {
      const g = mk({ hand: [ID] });
      if (lower) shrinkLeader(g, 'p1', lower);
      play(g, ID);
      if (ok) {
        expectDecision(g, 'choose', 'p1');
        pick(g, [g.leader('p1')]);
        expect(g.power(g.leader('p1'))).toBe(5000 - lower + 1000);
      } else {
        expect(dec(g)?.kind).toBe('main');
        expect(g.power(g.leader('p1'))).toBe(5000 - lower);
      }
    }
  });

  it('"up to 1": may decline; only your Leader can be chosen (not Characters, not their Leader)', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c1] });
    shrinkLeader(g, 'p1', 1000);
    play(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('has [Blocker]', () => {
    const g = p2Attacks({ leader: 'ST01-001', characters: [ID] }, V.c4, [V.c4]);
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
