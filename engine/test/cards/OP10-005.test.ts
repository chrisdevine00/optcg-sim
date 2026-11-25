/** OP10-005 Sanji. */
import { describe, expect, it } from 'vitest';
import { hand, pick } from './helpers.ts';
import { ids, koByEffect, mk, OPP, plantOpponentEffect } from './helpers-a10g1.ts';

const ID = 'OP10-005';

describe('OP10-005 Sanji', () => {
  it('[Your Turn]: gains +3000 power (3000 printed becomes 6000)', () => {
    const g = mk({ characters: [ID] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it("must not gain power on your opponent's turn", () => {
    const g = mk({ characters: [ID] }, {}, OPP);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000);
  });

  it("[On K.O.]: draws 1 card when K.O.'d by an effect", () => {
    const g = mk({ characters: [ID] }, {}, OPP);
    const before = g.zone('p1', 'deck').length;
    koByEffect(g, 'p1', ID);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(before - 1);
  });

  it("[On K.O.]: draws 1 card when K.O.'d in battle", () => {
    const g = mk({ characters: [{ card: ID, rested: true }] }, { characters: ['OP01-092'] }, OPP);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', 'OP01-092'),
      target: g.find('p1', 'characters', ID),
    });
    while (g.legal().some((a) => a.type === 'block' || a.type === 'endCounter')) {
      const a = g.legal().find((x) => x.type === 'block' || x.type === 'endCounter')!;
      g.act(a);
    }
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("must not draw when the Character leaves the field without being K.O.'d (returned to hand)", () => {
    const g = mk({ characters: [ID] }, {}, OPP);
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });
});
