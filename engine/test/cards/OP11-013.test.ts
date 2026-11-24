/** OP11-013 Prince Grus. */
import { describe, expect, it } from 'vitest';
import { buff, BLK2, BLK2B, BLK7, mk, SN2 } from './helpers-op11g1.ts';
import { dec } from './helpers.ts';

const ID = 'OP11-013';
const attack = (p2chars: string[]) => {
  const g = mk({ characters: [ID] }, { characters: p2chars });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};
const canBlockWith = (g: ReturnType<typeof mk>, card: string) =>
  g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p2', 'characters', card));

describe('OP11-013 Prince Grus', () => {
  it('[When Attacking]: opponent Characters with 2000 power or less cannot activate [Blocker]', () => {
    const g = attack([BLK2, BLK2B, BLK7]);
    expect(dec(g)?.kind).toBe('block');
    expect(canBlockWith(g, BLK2)).toBe(false); // 2000
    expect(canBlockWith(g, BLK2B)).toBe(false); // 2000
    expect(canBlockWith(g, BLK7)).toBe(true); // 7000
  });

  it('control: without Grus the same 2000 Blocker can block', () => {
    const g = mk({ characters: ['OP02-084'] }, { characters: [BLK2] });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP02-084'),
      target: g.leader('p2'),
    });
    expect(canBlockWith(g, BLK2)).toBe(true);
  });

  it('exact boundary on current power: 2001 can block, 2000 and a lowered 7000 (to 2000) cannot', () => {
    const g = mk({ characters: [ID] }, { characters: [BLK2, BLK2B, BLK7] });
    buff(g, g.find('p2', 'characters', BLK2), 1, 'p2'); // 2001
    buff(g, g.find('p2', 'characters', BLK7), -5000, 'p1'); // 2000
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(canBlockWith(g, BLK2)).toBe(true);
    expect(canBlockWith(g, BLK2B)).toBe(false);
    expect(canBlockWith(g, BLK7)).toBe(false);
  });

  it('a Character with no [Blocker] is unaffected (it could never block)', () => {
    const g = attack([SN2]);
    expect(canBlockWith(g, SN2)).toBe(false);
  });

  it('lasts this turn only: next turn a different attacker faces a legal block by the same 2000 Blocker', () => {
    const g = mk({ characters: [ID, 'OP02-084'] }, { characters: [BLK2] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(canBlockWith(g, BLK2)).toBe(false);
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP02-084'),
      target: g.leader('p2'),
    });
    expect(canBlockWith(g, BLK2)).toBe(true);
  });
});
