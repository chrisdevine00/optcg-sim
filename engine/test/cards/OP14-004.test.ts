/** OP14-004 Cavendish. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { V } from './helpers.ts';
import { boost, mk5, withDon } from './helpers-op14g1.ts';

const ID = 'OP14-004';

const has = (g: ReturnType<typeof mk5>, id: string, kw: string) =>
  g.card(id).keywords.includes(kw as never);

describe('OP14-004 Cavendish', () => {
  it('with 5000 power (3 DON!!) it gains [Rush]', () => {
    const g = mk5({ characters: [withDon(ID, 3)] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    expect(has(g, g.find('p1', 'characters', ID), 'Rush')).toBe(true);
  });

  it('boundary: 4000 power has no [Rush]', () => {
    const g = mk5({ characters: [withDon(ID, 2)] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    expect(has(g, g.find('p1', 'characters', ID), 'Rush')).toBe(false);
  });

  it('no DON!!: no [Rush], and a Character played this turn cannot attack', () => {
    const g = mk5({ characters: [{ card: ID, playedThisTurn: true }] });
    expect(has(g, g.find('p1', 'characters', ID), 'Rush')).toBe(false);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });

  it('a timed boost counts: +3000 this turn gives [Rush] and lets a fresh Character attack', () => {
    const g = mk5({ characters: [{ card: ID, playedThisTurn: true }] });
    const id = g.find('p1', 'characters', ID);
    boost(g, id, 3000);
    expect(has(g, id, 'Rush')).toBe(true);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(true);
  });

  it('loses [Rush] when power drops below 5000 again (a -1000 modifier)', () => {
    const g = mk5({ characters: [withDon(ID, 3)] }, { characters: [V.c1] });
    const id = g.find('p1', 'characters', ID);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: id,
        amount: -1000,
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    expect(g.power(id)).toBe(4000);
    expect(has(g, id, 'Rush')).toBe(false);
  });
});
