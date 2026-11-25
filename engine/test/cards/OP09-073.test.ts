/** OP09-073 Brook. */
import { describe, expect, it } from 'vitest';
import {
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  V,
} from './helpers.ts';
import { canPick, countOptions, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-073';
const start = (active = 3) =>
  game(
    { leader: PLAIN_PURPLE, characters: [ID], costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c2, V.c3, V.c4] },
  );
const attack = (g: ReturnType<typeof start>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
const power = (g: ReturnType<typeof start>, c: string) =>
  g.card(g.find('p2', 'characters', c)).power;

describe('OP09-073 Brook', () => {
  it('[When Attacking] returning DON!!: up to 2 opposing Characters get -2000 power this turn', () => {
    const g = start();
    attack(g);
    expectDecision(g, 'optional', 'p1');
    payReturn(g, 1);
    pick(g, [g.find('p2', 'characters', V.c2), g.find('p2', 'characters', V.c4)]);
    expect(power(g, V.c2)).toBe(2000);
    expect(power(g, V.c4)).toBe(4000);
    expect(power(g, V.c3)).toBe(5000);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('the -2000 lasts the turn and no longer', () => {
    const g = start();
    attack(g);
    payReturn(g, 1);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(power(g, V.c2)).toBe(2000);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(power(g, V.c2)).toBe(2000);
    g.act({ type: 'endTurn' });
    expect(power(g, V.c2)).toBe(4000);
  });

  it('boundary: at most 2 Characters; a 3rd cannot be picked, and the Leader is not a target', () => {
    const g = start();
    attack(g);
    payReturn(g, 1);
    const c2 = g.find('p2', 'characters', V.c2);
    const c3 = g.find('p2', 'characters', V.c3);
    const c4 = g.find('p2', 'characters', V.c4);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    g.act({ type: 'pick', choice: c2 });
    g.act({ type: 'pick', choice: c3 });
    expect(canPick(g, c4)).toBe(false);
  });

  it('"up to 2": none is allowed, and the cost was still paid', () => {
    const g = start();
    attack(g);
    payReturn(g, 1);
    none(g);
    expect(power(g, V.c2)).toBe(4000);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('declining the cost: no question about targets and no change in power', () => {
    const g = start();
    attack(g);
    decline(g);
    expect(power(g, V.c2)).toBe(4000);
    expect(don(g, 'p1').deck).toBe(7);
    expectDecision(g, 'block', 'p2');
  });

  it('the count is 1 to every DON!! on the field', () => {
    const g = start(5);
    attack(g);
    g.act({ type: 'optional', accept: true });
    expect(countOptions(g)).toEqual(['1', '2', '3', '4', '5']);
  });
});
