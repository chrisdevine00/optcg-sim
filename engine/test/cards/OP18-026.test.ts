/** OP18-026 Sanji. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, pick } from './helpers.ts';
import { ids, mk, OPP, plant, plantOpponentEffect } from './helpers-a10g1.ts';
import { SHC3, W7 } from './helpers-op18.ts';

const ID = 'OP18-026';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};
const hit = (target: string, action: object = KO, chars: string[] = []) => {
  const g = mk({ characters: [ID, ...chars, ...(target === ID ? [] : [target])] }, {}, OPP);
  plantOpponentEffect(g, action as Record<string, unknown>);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP18-026 Sanji', () => {
  it("trashes Sanji instead when your {Straw Hat Crew} Character would be K.O.'d by the opponent's effect", () => {
    const g = hit(SHC3);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([SHC3]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining lets the removal happen', () => {
    const g = hit(SHC3);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([SHC3]);
  });

  it('covers a return to the hand too (any removal by the opponent)', () => {
    const g = hit(SHC3, BOUNCE);
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([SHC3]);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('must not cover a Character without the {Straw Hat Crew} type', () => {
    const g = hit(W7);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'trash')).toEqual([W7]);
  });

  it("must not apply to your own effect's removal", () => {
    const g = mk({ characters: [ID, SHC3] });
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    pick(g, [g.find('p1', 'characters', SHC3)]);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash')).toEqual([SHC3]);
  });
});
