/** OP11-006 Zephyr. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick } from './helpers.ts';
import { offered, OTHER_LEADER, SLASH3, SPECIAL3, SPECIAL6 } from './helpers-lfa.ts';
import { game } from './helpers.ts';

const ID = 'OP11-006';

/** p1's turn: Zephyr (with `don` DON!! given) attacks p2's Leader; p2 has these Characters. */
const attack = (don: number, p2: string[], p1: string[] = []) => {
  const g = game(
    {
      leader: OTHER_LEADER,
      characters: [{ card: ID, don }, ...p1],
      costArea: { active: 3, rested: 0 },
    },
    { leader: 'ST03-001', characters: p2 },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP11-006 Zephyr', () => {
  it("[DON!! x1] [When Attacking] gives up to 1 of your opponent's <Special> Characters -5000 power during this turn", () => {
    const g = attack(1, [SPECIAL6, SLASH3]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', SPECIAL6)]);
    expect(g.power(g.find('p2', 'characters', SPECIAL6))).toBe(8000 - 5000);
    expect(g.power(g.find('p2', 'characters', SLASH3))).toBe(5000);
    expectDecision(g, 'block', 'p2');
  });

  it('only <Special> Characters can be chosen: not a <Slash> one, not the Leader (also <Special>)', () => {
    const g = attack(1, [SPECIAL6, SLASH3]);
    expect(offered(g)).toEqual([g.find('p2', 'characters', SPECIAL6)]);
    expect(offered(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": the pick can be declined, and nothing changes', () => {
    const g = attack(1, [SPECIAL6, SPECIAL3]);
    none(g);
    expect(g.power(g.find('p2', 'characters', SPECIAL6))).toBe(8000);
    expect(g.power(g.find('p2', 'characters', SPECIAL3))).toBe(5000);
  });

  it('one target only: of two <Special> Characters one is chosen', () => {
    const g = attack(1, [SPECIAL6, SPECIAL3]);
    expect(offered(g)).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', SPECIAL3)]);
    expect(g.power(g.find('p2', 'characters', SPECIAL3))).toBe(5000 - 5000);
    expect(g.power(g.find('p2', 'characters', SPECIAL6))).toBe(8000);
  });

  it('must not fire without a DON!! given to Zephyr', () => {
    const g = attack(0, [SPECIAL6]);
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.find('p2', 'characters', SPECIAL6))).toBe(8000);
  });

  it('must not offer your own <Special> Characters', () => {
    const g = attack(1, [SPECIAL6], [SPECIAL3]);
    expect(offered(g)).toEqual([g.find('p2', 'characters', SPECIAL6)]);
  });

  it('with no <Special> Character on their side nothing is asked (the board is public)', () => {
    const g = attack(1, [SLASH3]);
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.find('p2', 'characters', SLASH3))).toBe(5000);
  });
});
