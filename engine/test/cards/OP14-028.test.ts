/** OP14-028 Johnny. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-028';

describe('OP14-028 Johnny', () => {
  const start = () =>
    mk(
      { characters: [ID] },
      { characters: [restedCard(V.c1), restedCard(V.c2), restedCard(V.c3), V.c1] },
    );

  it("[Your Turn] when rested: K.O.s up to 1 of the opponent's rested Characters with a cost of 2 or less", () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).not.toContain(V.c2);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    finishBattle(g);
  });

  it('boundary: cost 2 and 1 rested are candidates; cost 3 rested and an active cost-1 are not', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p2', 'characters', V.c1, 0))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1, 1))).toBe(false); // active
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('with no rested cost-2-or-less Character nothing is asked', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c1, restedCard(V.c3)] });
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("must not fire when rested on the opponent's turn", () => {
    const g = mk(
      { characters: [ID] },
      { characters: [restedCard(V.c1)] },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
