/** OP10-015 Mocha. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-a10g1.ts';

const ID = 'OP10-015';

describe('OP10-015 Mocha', () => {
  it('[On Play]: gives up to 1 opponent Character -1000 power this turn', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c5, V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('"up to 1": may decline; only opponent Characters are candidates', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c5] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('without an opponent Character nothing is chosen', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
