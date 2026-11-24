/** OP13-008 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { mk, RA } from './helpers-op13g1.ts';

const ID = 'OP13-008';

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

describe('OP13-008 Emporio.Ivankov', () => {
  it("instead of your Revolutionary Army Character being K.O.'d by the opponent's effect, you may trash Ivankov", () => {
    const g = byOpponent({ characters: [ID, RA.c5] }, RA.c5);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([RA.c5]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });

  it("may be declined: the Character is K.O.'d and Ivankov stays", () => {
    const g = byOpponent({ characters: [ID, RA.c5] }, RA.c5);
    decline(g);
    expect(chars(g)).toEqual([ID]);
  });

  it('a non-Revolutionary Army Character is not protected (no offer)', () => {
    const g = byOpponent({ characters: [ID, V.c4] }, V.c4);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).toEqual([ID]);
  });

  it('must not fire for your own effect, nor for a return to hand by the opponent', () => {
    const own = mk({ characters: [ID, RA.c5] });
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', RA.c5),
      by: 'p1',
    }).state;
    expectDecision(own, 'main', 'p1');
    expect(chars(own)).toEqual([ID]);

    const bounce = byOpponent({ characters: [ID, RA.c5] }, RA.c5, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    expectDecision(bounce, 'main', 'p2');
    expect(chars(bounce)).toEqual([ID]);
  });

  it("Ivankov is a Revolutionary Army Character himself: he may trash himself instead of being K.O.'d (reading)", () => {
    const g = byOpponent({ characters: [ID] }, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });
});
