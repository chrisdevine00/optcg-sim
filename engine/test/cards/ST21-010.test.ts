/** ST21-010 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { attack, boost, finishBattle, mk, offered } from './helpers-st1821.ts';

const ID = 'ST21-010';

const start = (don: number) =>
  mk(
    { characters: [{ card: ID, don }], costArea: { active: 5, rested: 0 } },
    {
      characters: [V.c1, V.c2, V.c3],
    },
  );

describe('ST21-010 Nico Robin', () => {
  it('[DON!! x2] [When Attacking]: K.O.s up to 1 Character with 4000 power or less (5000 is not offered)', () => {
    const g = start(2);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1, V.c3]);
    finishBattle(g);
  });

  it('boundary: 1 DON!! given does nothing (no prompt)', () => {
    const g = start(1);
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).toBe('block');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    finishBattle(g);
  });

  it('"up to 1": may be declined', () => {
    const g = start(2);
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    finishBattle(g);
  });

  it('with no Character of 4000 power or less nothing is asked', () => {
    const g = mk(
      { characters: [{ card: ID, don: 2 }], costArea: { active: 5, rested: 0 } },
      { characters: [V.c3, V.c4] },
    );
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).toBe('block');
    finishBattle(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('the limit is current power: +1000 on a 4000 Character removes it, -1000 on a 5000 one adds it', () => {
    const g = start(2);
    boost(g, g.find('p2', 'characters', V.c2), 1000);
    boost(g, g.find('p2', 'characters', V.c3), -1000);
    attack(g, g.find('p1', 'characters', ID));
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c3)].sort(),
    );
  });
});
