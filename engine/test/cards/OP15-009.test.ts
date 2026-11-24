/** OP15-009 Koby. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { boost, mk } from './helpers-op15g1.ts';

const ID = 'OP15-009';

/** p2 K.O.s (or moves) one of p1's Characters with a planted effect: an opponent's effect. */
const byOpponent = (p1: Partial<PlayerSpec>, target: string, action?: Record<string, unknown>) => {
  const g = mk(p1, {}, { turn: 4, activePlayer: 'p2' });
  plantOpponentEffect(
    g,
    action ?? { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } },
  );
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP15-009 Koby', () => {
  it("instead of a 7000-base-power-or-less Character being K.O.'d by the opponent's effect, gives your Leader -2000 power", () => {
    const g = byOpponent({ characters: [ID, V.c4] }, V.c4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toContain(V.c4);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it("may be declined: the Character is K.O.'d and the Leader keeps its power", () => {
    const g = byOpponent({ characters: [ID, V.c4] }, V.c4);
    decline(g);
    expect(chars(g)).not.toContain(V.c4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: 7000 base is covered, 8000 base is not (no offer, K.O.)', () => {
    const seven = byOpponent({ characters: [ID, V.c5] }, V.c5);
    expectDecision(seven, 'optional', 'p1');
    accept(seven);
    expect(chars(seven)).toContain(V.c5);

    const eight = byOpponent({ characters: [ID, V.c6] }, V.c6);
    expectDecision(eight, 'main', 'p2');
    expect(chars(eight)).not.toContain(V.c6);
    expect(eight.power(eight.leader('p1'))).toBe(5000);
  });

  it('reads BASE power: a 7000 Character boosted to 8000 is still covered', () => {
    const g = mk({ characters: [ID, V.c5] }, {}, { turn: 4, activePlayer: 'p2' });
    boost(g, g.find('p1', 'characters', V.c5), 1000, 4);
    expect(g.power(g.find('p1', 'characters', V.c5))).toBe(8000);
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expectDecision(g, 'optional', 'p1');
  });

  it('Koby protects himself (2000 base) and any removal, a return to hand included', () => {
    const g = byOpponent({ characters: [ID] }, ID);
    accept(g);
    expect(chars(g)).toEqual([ID]);

    const bounce = byOpponent({ characters: [ID, V.c4] }, V.c4, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    expectDecision(bounce, 'optional', 'p1');
    accept(bounce);
    expect(chars(bounce)).toContain(V.c4);
  });

  it('must not fire for your own effect (nor with Koby off the field)', () => {
    const own = mk({ characters: [ID, V.c4] });
    const victim = own.find('p1', 'characters', V.c4);
    own.state = applyOp(own.state, { op: 'ko', card: victim, by: 'p1' }).state;
    expectDecision(own, 'main', 'p1');
    expect(chars(own)).not.toContain(V.c4);

    const none = byOpponent({ characters: [V.c4] }, V.c4);
    expectDecision(none, 'main', 'p2');
    expect(chars(none)).not.toContain(V.c4);
  });
});
