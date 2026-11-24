/** OP15-018 Mohji. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, V, expectDecision, none, pick } from './helpers.ts';
import { boost, choices, mk } from './helpers-w4sa.ts';

const ID = 'OP15-018';

describe('OP15-018 Mohji', () => {
  // BLUE and PURPLE are 3000 power; V.c2 is 4000.
  const start = (chars: unknown[]) => mk({ characters: [ID] }, { characters: chars as never });
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it('offers a Character with 3000 power and a DON!! given, and K.O.s the chosen one', () => {
    const g = start([{ card: BLUE, don: 1 }]);
    attack(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', BLUE)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('excludes 4000 power (just over), and 3000 power with no DON!! given', () => {
    const g = start([{ card: V.c2, don: 1 }, PURPLE, { card: BLUE, don: 2 }]);
    attack(g);
    expect(choices(g)).toEqual([g.find('p2', 'characters', BLUE)]);
  });

  it('"up to 1": none may be chosen', () => {
    const g = start([{ card: BLUE, don: 1 }]);
    attack(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a power-lowering effect brings a 4000 Character under the line', () => {
    const g = start([{ card: V.c2, don: 1 }]);
    attack(g);
    // 4000 is over the limit: nothing to choose, the Character stays.
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = start([{ card: V.c2, don: 1 }]);
    boost(h, h.find('p2', 'characters', V.c2), -1000);
    attack(h);
    expect(choices(h)).toEqual([h.find('p2', 'characters', V.c2)]);
  });
});
