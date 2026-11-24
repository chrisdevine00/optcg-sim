/** OP14-051 Hatchan. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { PURPLE, V, endCounter, hand, passBlock } from './helpers.ts';
import { mk } from './helpers-w4sa.ts';

const ID = 'OP14-051';

describe('OP14-051 Hatchan', () => {
  const start = (don: number) =>
    mk(
      { characters: [{ card: ID, don }], costArea: { active: 10 - don, rested: 0 } },
      { characters: [PURPLE] },
    );
  const ko = (g: ReturnType<typeof start>, by: 'p1' | 'p2' = 'p2') =>
    (g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by }).state);

  it('[DON!! x2] draws 1 card when K.O.’d with 2 DON!! given', () => {
    const g = start(2);
    const before = hand(g, 'p1').length;
    ko(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('draws 1 (not more) with 3 DON!! given', () => {
    const g = start(3);
    const before = hand(g, 'p1').length;
    ko(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('does not draw with only 1 DON!! given (boundary) or none', () => {
    for (const don of [1, 0]) {
      const g = start(don);
      const before = hand(g, 'p1').length;
      ko(g);
      expect(hand(g, 'p1')).toHaveLength(before);
    }
  });

  it('a battle K.O. draws as well', () => {
    const g = mk(
      { characters: [{ card: ID, don: 2, rested: true }], costArea: { active: 8, rested: 0 } },
      { characters: [V.c7] },
    );
    g.act({ type: 'endTurn' });
    const before = hand(g, 'p1').length;
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });
});
