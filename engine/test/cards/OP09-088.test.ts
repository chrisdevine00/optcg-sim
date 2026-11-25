/** OP09-088 Shiryu. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canAccept,
  dec,
  decline,
  expectDecision,
  handIds,
  mk,
  pick,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-088';
const start = (don: number, hand: string[] = [V.c1, V.c2, V.c3]) =>
  mk({ characters: [{ card: ID, don }], hand, deck: [V.c4, V.c5, V.c6, V.c7] }, {}, undefined, 9);
const attack = (g: ReturnType<typeof start>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

describe('OP09-088 Shiryu', () => {
  it('[DON!! x1][When Attacking] trash 2 cards from your hand: draw 2 cards', () => {
    const g = start(1);
    attack(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(
      g
        .zone('p1', 'trash')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2].sort());
    expect(handIds(g, 'p1')).toHaveLength(3); // 3 - 2 + 2
    expect(handIds(g, 'p1')).toContain(V.c4);
  });

  it('declining the cost trashes nothing and draws nothing', () => {
    const g = start(1);
    attack(g);
    decline(g);
    expect(handIds(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('block');
  });

  it('exactly 2 cards in hand is enough (boundary)', () => {
    const g = start(1, [V.c1, V.c2]);
    attack(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(handIds(g, 'p1')).toHaveLength(2);
  });

  it('must not be offered with only 1 card in hand', () => {
    const g = start(1, [V.c1]);
    attack(g);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(handIds(g, 'p1')).toEqual([V.c1]);
  });

  it('must not fire without a DON!! card given', () => {
    const g = start(0);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(handIds(g, 'p1')).toHaveLength(3);
  });
});
