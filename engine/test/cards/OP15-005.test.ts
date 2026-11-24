/** OP15-005 Cabaji. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, PLAIN_BLUE, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-005';

describe('OP15-005 Cabaji', () => {
  const attack = (p1: Parameters<typeof mk>[0], p2: Parameters<typeof mk>[1]) => {
    const g = mk({ characters: [ID], ...p1 }, p2);
    const cabaji = g.find('p1', 'characters', ID);
    g.act({ type: 'attack', attacker: cabaji, target: g.leader('p2') });
    return { g, cabaji };
  };

  it('[When Attacking]: with DON!! given to the opponent Leader, +2000 power (3000 to 5000)', () => {
    const { g, cabaji } = attack({}, { leader: { card: PLAIN_BLUE, don: 1 } });
    expect(g.power(cabaji)).toBe(5000);
  });

  it('DON!! given to an opposing Character counts too', () => {
    const { g, cabaji } = attack({}, { characters: [{ card: V.c2, don: 1 }] });
    expect(g.power(cabaji)).toBe(5000);
  });

  it('boundary: exactly 1 given DON!! is enough, and 3 give the same +2000', () => {
    const one = attack({}, { leader: { card: PLAIN_BLUE, don: 1 } });
    expect(one.g.power(one.cabaji)).toBe(5000);
    const three = attack({}, { leader: { card: PLAIN_BLUE, don: 3 } });
    expect(three.g.power(three.cabaji)).toBe(5000);
  });

  it('must not fire with no DON!! given to the opponent (untouched, or only DON!! in the cost area)', () => {
    const none = attack({}, {});
    expect(none.g.power(none.cabaji)).toBe(3000);
    const rested = attack({}, { costArea: { active: 0, rested: 5 } });
    expect(rested.g.power(rested.cabaji)).toBe(3000);
  });

  it('must not fire when only YOUR cards have DON!! given', () => {
    const { g, cabaji } = attack(
      { leader: { card: RED_LEADER, don: 2 }, costArea: { active: 8, rested: 0 } },
      {},
    );
    expect(g.power(cabaji)).toBe(3000);
  });
});
