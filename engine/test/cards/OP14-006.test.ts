/** OP14-006 Shachi & Penguin. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { attack, boost, finishBattle, mk5, withDon } from './helpers-op14g1.ts';

const ID = 'OP14-006';

const start = (don: number) =>
  mk5({ characters: [withDon(ID, don)] }, { characters: [V.c2, V.c5] });

describe('OP14-006 Shachi & Penguin', () => {
  it('[When Attacking] with 5000 power: -2000 to up to 1 opposing Character this turn', () => {
    const g = start(3);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000);
    finishBattle(g);
  });

  it('only Characters are candidates (not the Leader)', () => {
    const g = start(3);
    attack(g, g.find('p1', 'characters', ID));
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(choices).toHaveLength(2);
    expect(choices).not.toContain(g.leader('p2'));
  });

  it('boundary: 4000 power does not fire', () => {
    const g = start(2);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('a boost to exactly 5000 enables it', () => {
    const g = start(2);
    boost(g, g.find('p1', 'characters', ID), 1000);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
  });

  it('"up to 1": may choose nothing', () => {
    const g = start(3);
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });
});
