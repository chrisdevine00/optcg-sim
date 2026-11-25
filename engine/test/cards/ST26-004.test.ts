/** ST26-004 General Franky. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, payDon, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-st2627.ts';

const ID = 'ST26-004';
/** Franky costs 8: 10 active DON!!; after the play 2 are active and DON!! -2 returns them. */
const start = (oppChars: string[], mine: string[] = []) =>
  mk({ hand: [ID], characters: mine }, { characters: oppChars });
const go = (g: ReturnType<typeof start>) => {
  play(g, ID);
  accept(g);
  payDon(g);
};

describe('ST26-004 General Franky', () => {
  it('[On Play] DON!! -2: up to 2 opposing Characters get -2000 power this turn', () => {
    const g = start([V.c1, V.c2, V.c3]);
    go(g);
    expect(don(g, 'p1').deck).toBe(2);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(1000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000);
  });

  it('"up to 2" may choose just 1, or none; the DON!! -2 is paid either way', () => {
    const one = start([V.c1, V.c2]);
    go(one);
    pick(one, [one.find('p2', 'characters', V.c2)]);
    expect(one.power(one.find('p2', 'characters', V.c2))).toBe(2000);
    expect(one.power(one.find('p2', 'characters', V.c1))).toBe(3000);
    const zero = start([V.c1]);
    go(zero);
    none(zero);
    expect(zero.power(zero.find('p2', 'characters', V.c1))).toBe(3000);
    expect(don(zero, 'p1').deck).toBe(2);
  });

  it('only opposing Characters are offered (not your own, not the Leaders)', () => {
    const g = start([V.c1], [V.c2]);
    go(g);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('the -2000 is not clamped and lasts this turn only', () => {
    const g = start([V.c1]);
    go(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    const id = g.find('p2', 'characters', V.c1);
    expect(g.power(id)).toBe(1000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('declining the DON!! -2: no -2000 and no target is asked', () => {
    const g = start([V.c1]);
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expect(don(g, 'p1').deck).toBe(0);
  });
});
