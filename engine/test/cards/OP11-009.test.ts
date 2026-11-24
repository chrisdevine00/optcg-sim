/** OP11-009 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { finishBattle, mk5, pw } from './helpers-op11g1.ts';

const ID = 'OP11-009';
const attackWith = (don: number, p2chars = [V.c4, V.c1]) => {
  const g = mk5({ characters: [{ card: ID, don }] }, { characters: p2chars });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP11-009 Nico Robin', () => {
  it("[DON!! x2][When Attacking]: -2000 power until the end of your opponent's next turn", () => {
    const g = attackWith(2);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(pw(g, 'p2', V.c4)).toBe(4000);
    finishBattle(g);
    g.act({ type: 'endTurn' }); // p2's turn: still lowered
    expect(pw(g, 'p2', V.c4)).toBe(4000);
    g.act({ type: 'endTurn' }); // p1's turn: restored
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('with only 1 DON!! given, nothing happens', () => {
    const g = attackWith(1);
    expect(dec(g)?.kind).toBe('block');
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = attackWith(2);
    none(g);
    expect(pw(g, 'p2', V.c4)).toBe(6000);
  });

  it('only Characters can be chosen, not the Leader', () => {
    const g = attackWith(2);
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p2'))).toBe(false);
  });

  it('3 DON!! given also satisfies [DON!! x2]', () => {
    const g = attackWith(3);
    expectDecision(g, 'choose', 'p1');
  });
});
