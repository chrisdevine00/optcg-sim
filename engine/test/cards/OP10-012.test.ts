/** OP10-012 Dragon Number Thirteen. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, OPP } from './helpers-a10g1.ts';

const ID = 'OP10-012';

describe('OP10-012 Dragon Number Thirteen', () => {
  it('printed [Blocker] only: it can block an attack on the Leader', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c7] }, OPP);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    const dragon = g.find('p1', 'characters', ID);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker === dragon)).toBe(true);
  });

  it('has no other effect: power stays 2000 on either turn', () => {
    const mine = mk({ characters: [ID] });
    expect(mine.power(mine.find('p1', 'characters', ID))).toBe(2000);
    const theirs = mk({ characters: [ID] }, {}, OPP);
    expect(theirs.power(theirs.find('p1', 'characters', ID))).toBe(2000);
  });
});
