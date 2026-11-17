/** OP15-035 Laboon. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  pick,
  play,
  payDon,
  KAIDO,
  V,
} from './helpers.ts';
import { PLAIN_BLUE, pickDon, plantOpponentEffect, RGL } from './helpers-rgl-penel.ts';

/** p2 (Kaido) K.O.s p1's `target` with Gum-Gum Lightning, an opponent's effect. */
const koByEffect = (p1: Partial<PlayerSpec>, target: string) => {
  const g = game(
    { leader: RGL, ...p1 },
    { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 4, rested: 0 } },
    { turn: 4, activePlayer: 'p2' },
  );
  play(g, 'OP09-077');
  accept(g);
  payDon(g);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP15-035 Laboon', () => {
  it("rests 2 DON!! instead of a Character with 7000 base power or less being K.O.'d by the opponent's effect", () => {
    const g = koByEffect(
      { characters: ['OP15-035', V.c4], costArea: { active: 3, rested: 0 } },
      V.c4,
    );
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pickDon(g, 'active', 2);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('may rest Characters (Laboon itself included) instead of DON!!', () => {
    const g = koByEffect({ characters: ['OP15-035', V.c4] }, V.c4);
    accept(g);
    pick(g, [g.find('p1', 'characters', 'OP15-035'), g.leader('p1')]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
    expect(g.card(g.find('p1', 'characters', 'OP15-035')).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it("may be declined: the Character is K.O.'d", () => {
    const g = koByEffect(
      { characters: ['OP15-035', V.c4], costArea: { active: 3, rested: 0 } },
      V.c4,
    );
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
    expect(don(g, 'p1').active).toBe(3);
  });

  const planted = (action: Record<string, unknown>) => {
    const g = game(
      {
        leader: RGL,
        characters: ['OP15-035', V.c6, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, action);
    return g;
  };
  const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

  it('a Character with more than 7000 base power (8000) is not covered', () => {
    const g = planted(koOne);
    pick(g, [g.find('p1', 'characters', V.c6)]);
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c6);
  });

  it("covers every removal by the opponent's effect, a bounce included", () => {
    const g = planted({
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pickDon(g, 'active', 2);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
  });

  it('cannot be used with fewer than 2 active cards to rest', () => {
    const g = koByEffect(
      {
        leader: { card: RGL, rested: true },
        characters: [{ card: 'OP15-035', rested: true }, V.c4],
      },
      V.c4,
    );
    // Only the target itself is active: one card, not two.
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
  });

  it('does not apply to a battle K.O.', () => {
    const g = game(
      {
        leader: RGL,
        characters: ['OP15-035', { card: V.c4, rested: true }],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.find('p1', 'characters', V.c4),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
  });
});
