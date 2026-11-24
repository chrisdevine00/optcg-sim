/** OP13-017 Monkey.D.Dragon. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { mk, RA } from './helpers-op13g1.ts';

const ID = 'OP13-017';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};

/** p2 uses a planted effect (an opposing effect) on one of p1's Characters. */
const byOpponent = (
  p1: Partial<PlayerSpec>,
  target: string,
  action: Record<string, unknown> = KO,
) => {
  const g = mk(p1, {}, { turn: 4, activePlayer: 'p2' });
  plantOpponentEffect(g, action);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);
const dragon = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

describe('OP13-017 Monkey.D.Dragon', () => {
  it("instead of your {Revolutionary Army} Character being removed by the opponent's effect, Dragon gets -2000 power this turn (the Character stays)", () => {
    const g = byOpponent({ characters: [ID, RA.c5] }, RA.c5);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([ID, RA.c5]);
    expect(g.power(dragon(g))).toBe(5000);
  });

  it('a return to hand is a removal too, and is replaced', () => {
    const g = byOpponent({ characters: [ID, RA.c5] }, RA.c5, BOUNCE);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([ID, RA.c5]);
    expect(g.power(dragon(g))).toBe(5000);
  });

  it('may be declined: the Character is removed and Dragon keeps his power', () => {
    const g = byOpponent({ characters: [ID, RA.c5] }, RA.c5);
    decline(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.power(dragon(g))).toBe(7000);
  });

  it('Once Per Turn: a second removal in the same turn is not offered', () => {
    const g = byOpponent({ characters: [ID, RA.c5, RA.c2] }, RA.c5);
    accept(g);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', RA.c2)]);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).toEqual([ID, RA.c5]);
    expect(g.power(dragon(g))).toBe(5000);
  });

  it('Dragon is a Revolutionary Army Character himself and may protect himself', () => {
    const g = byOpponent({ characters: [ID] }, ID);
    accept(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.power(dragon(g))).toBe(5000);
  });

  it('must not fire for a non-Revolutionary Army Character or for your own effect', () => {
    const other = byOpponent({ characters: [ID, V.c4] }, V.c4);
    expectDecision(other, 'main', 'p2');
    expect(chars(other)).toEqual([ID]);

    const own = mk({ characters: [ID, RA.c5] });
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', RA.c5),
      by: 'p1',
    }).state;
    expectDecision(own, 'main', 'p1');
    expect(chars(own)).toEqual([ID]);
  });
});
