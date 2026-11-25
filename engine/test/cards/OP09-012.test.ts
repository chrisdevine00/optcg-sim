/** OP09-012 Monster. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, expectDecision, pick, V } from './helpers.ts';
import { koedInBattle, mk, OPP, plantOpponentEffect, types } from './helpers-a09g1.ts';

const ID = 'OP09-012';
const BONK = 'OP09-010';
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

/** p2 K.O.s (or moves) one of p1's Characters with a planted effect: an opponent's effect. */
const byOpponent = (p1: Partial<PlayerSpec>, target: string, action?: Record<string, unknown>) => {
  const g = mk(p1, {}, OPP);
  plantOpponentEffect(
    g,
    action ?? { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } },
  );
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP09-012 Monster', () => {
  it("instead of your [Bonk Punch] being K.O.'d by an effect, you may trash Monster", () => {
    const g = byOpponent({ characters: [ID, BONK] }, BONK);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([BONK]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(types(g)).not.toContain('KO');
  });

  it("may be declined: [Bonk Punch] is K.O.'d and Monster stays", () => {
    const g = byOpponent({ characters: [ID, BONK] }, BONK);
    decline(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BONK]);
  });

  it("covers an effect of either player: your own effect K.O.'ing [Bonk Punch] is replaced too", () => {
    const g = mk({ characters: [ID, BONK] });
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', BONK),
      by: 'p1',
    }).state;
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([BONK]);
  });

  it('a Character that is not [Bonk Punch] is not protected (no offer), and Monster itself is not either', () => {
    const other = byOpponent({ characters: [ID, V.c4] }, V.c4);
    expectDecision(other, 'main', 'p2');
    expect(chars(other)).toEqual([ID]);
    const self = byOpponent({ characters: [ID, BONK] }, ID);
    expectDecision(self, 'main', 'p2');
    expect(chars(self)).toEqual([BONK]);
  });

  it('must not fire for a K.O. in battle, nor for a return to hand by an effect', () => {
    const battle = koedInBattle(BONK, { leader: 'ST01-001', characters: [ID] });
    expect(dec(battle)?.kind).not.toBe('optional');
    expect(chars(battle)).toEqual([ID]);

    const bounce = byOpponent({ characters: [ID, BONK] }, BONK, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    expectDecision(bounce, 'main', 'p2');
    expect(chars(bounce)).toEqual([ID]);
  });
});
