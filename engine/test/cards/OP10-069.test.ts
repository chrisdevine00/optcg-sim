/** OP10-069 Fighting Fish. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, none, payDon, pick, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, mk } from './helpers-a10g2.ts';

const ID = 'OP10-069';

describe('OP10-069 Fighting Fish', () => {
  const start = (don = 1) =>
    mk(
      { characters: [{ card: ID, don }], costArea: { active: 4, rested: 0 } },
      { characters: [V.c1, V.c2] },
    );

  it("[DON!! x1] [When Attacking] DON!! -1: K.O.s up to 1 of your opponent's Characters with a cost of 1 or less", () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, deck: 6 });
    finishBattle(g);
  });

  it('boundary: cost 1 is a candidate, cost 2 is not', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('"up to 1": may K.O. nothing (the DON!! is still returned)', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    accept(g);
    payDon(g);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').deck).toBe(6);
  });

  it('"You may": declining returns no DON!! and K.O.s nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').deck).toBe(5);
  });

  it('must not fire without a DON!! given to it', () => {
    const g = start(0);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
