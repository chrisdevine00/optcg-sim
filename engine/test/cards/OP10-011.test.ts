/** OP10-011 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, OPP } from './helpers-a10g1.ts';

const ID = 'OP10-011';

describe('OP10-011 Tony Tony.Chopper', () => {
  it('printed [Blocker]: can block an attack on the Leader', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c7] }, OPP);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    const chopper = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === chopper)).toBe(true);
  });

  it("[Opponent's Turn]: +2000 power (4000 printed becomes 6000)", () => {
    const g = mk({ characters: [ID] }, {}, OPP);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('must not gain power on your own turn', () => {
    const g = mk({ characters: [ID] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });
});
