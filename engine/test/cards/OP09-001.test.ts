/** OP09-001 Shanks (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, none, pick, V } from './helpers.ts';
import { canPick, finishBattle, mk, p2Attacks } from './helpers-a09g1.ts';

const ID = 'OP09-001';
/** p2's 6000 Character (V.c4) attacks p1's Shanks Leader; p2 also has a second, active 7000 Character. */
const attacked = (p1: object = {}) =>
  p2Attacks({ leader: ID, characters: [V.c1], ...p1 }, V.c4, [V.c4, V.c5]);
/** "This effect can be activated when ..." is optional (W57-R5): the use is asked, answered yes. */
const start = (p1: object = {}) => {
  const g = attacked(p1);
  accept(g);
  return g;
};

describe('OP09-001 Shanks', () => {
  it('[Once Per Turn] when your opponent attacks: -1000 power to up to 1 of their Leader or Characters, this turn', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(5000);
    finishBattle(g);
    // still lowered for the rest of the turn, restored when it is p1's turn
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('the lowered power counts in the battle: a 6000 attacker at 5000 still hits the 5000 Leader', () => {
    const g = start({ life: [V.c1, V.c1] });
    pick(g, [g.find('p2', 'characters', V.c4)]);
    finishBattle(g);
    expect(g.life('p1')).toBe(1); // 5000 vs 5000: the Leader is hit
  });

  it('can lower the opponent Leader or any of their Characters, never your own cards', () => {
    const g = start();
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(4000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start();
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('is Once Per Turn: a second attack in the same turn does not offer it again', () => {
    const g = start();
    pick(g, [g.find('p2', 'characters', V.c4)]);
    finishBattle(g);
    expect(dec(g)?.kind).toBe('main');
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).toBe('block');
  });

  it('W57-R5: "can be activated" is optional: declining does not spend the Once Per Turn, the next attack asks again', () => {
    const g = attacked();
    decline(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    finishBattle(g);
    expect(dec(g)?.kind).toBe('main');
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.leader('p1'),
    });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
  });

  it("must not fire on your own attack (it needs your opponent's)", () => {
    const g = mk({ leader: ID, characters: [V.c4] }, { characters: [V.c3] });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c4),
      target: g.leader('p2'),
    });
    expectDecision(g, 'block', 'p2');
  });
});
