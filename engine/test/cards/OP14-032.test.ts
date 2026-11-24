/** OP14-032 Humandrill. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-032';

describe('OP14-032 Humandrill', () => {
  const start = () =>
    mk({ characters: [ID] }, { characters: [V.c1, V.c4, V.c5, restedCard(V.c2)] });

  it("[Your Turn] when rested: rests up to 1 of the opponent's Characters with a cost of 4 or less", () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    finishBattle(g);
  });

  it('boundary: cost 4 is a candidate, cost 5 is not; the Leader is not', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // text says Characters, not active ones: an already rested one may be named (no-op)
  });

  it('"up to 1": may rest nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });

  it('a rested Character cannot block: the rested target is why it matters (a cost-4 blocker rested cannot block)', () => {
    const g = mk({ characters: [ID] }, { characters: ['ST10-010'] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p2', 'characters', 'ST10-010')]);
    expect(g.legal().some((a) => a.type === 'block' && a.blocker !== null)).toBe(false);
  });

  it('must not fire when rested on the opponent turn', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c1] }, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });
});
