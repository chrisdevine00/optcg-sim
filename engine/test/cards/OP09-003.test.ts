/** OP09-003 Shachi & Penguin. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { attackLeader, BLK, canPick, finishBattle, mk } from './helpers-a09g1.ts';

const ID = 'OP09-003';
const start = () => {
  const g = mk({ characters: [ID, V.c1] }, { characters: [V.c4, V.c3] });
  attackLeader(g, g.find('p1', 'characters', ID));
  return g;
};

describe('OP09-003 Shachi & Penguin', () => {
  it("[When Attacking]: gives up to 1 of your opponent's Characters -2000 power during this turn", () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    finishBattle(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000); // still lowered this turn
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('only opponent Characters can be chosen: not their Leader, not your own cards', () => {
    const g = start();
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start();
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('a Character at 2000 power drops to 0 (not below)', () => {
    const g = mk({ characters: [ID] }, { characters: [BLK.c2] });
    attackLeader(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p2', 'characters', BLK.c2)]);
    expect(g.power(g.find('p2', 'characters', BLK.c2))).toBe(0);
  });

  it('must not fire when another Character attacks (the effect is only its own [When Attacking])', () => {
    const g = mk({ characters: [ID, V.c2] }, { characters: [V.c4] });
    attackLeader(g, g.find('p1', 'characters', V.c2));
    expectDecision(g, 'block', 'p2');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });
});
