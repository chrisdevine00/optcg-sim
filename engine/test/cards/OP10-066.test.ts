/** OP10-066 Giolla. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, none, payDon, pick, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { finishBattle, mk, restedCard } from './helpers-a10g2.ts';

const ID = 'OP10-066';

describe('OP10-066 Giolla', () => {
  // p2's turn: p2 attacks p1's Leader with the cost-7 Character; p2 also has a cost-4 and a cost-5 Character.
  const start = (
    p1: Parameters<typeof mk>[0] = {},
    p2chars: string[] = [V.c7, V.c4, V.c5, V.c7],
  ) => {
    const g = mk(
      { characters: [ID], costArea: { active: 3, rested: 0 }, ...p1 },
      { characters: p2chars },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    return g;
  };

  it("[On Your Opponent's Attack] rest 2 DON!!: rests up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = start();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('boundary: cost 4 is a candidate, cost 5 and 7 are not', () => {
    const g = start();
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c7, 1))).toBe(false);
  });

  it('"up to 1": may rest nothing (the DON!! is still rested)', () => {
    const g = start();
    accept(g);
    payDon(g);
    none(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('"You may": declining rests no DON!! and rests nothing', () => {
    const g = start();
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('must not be offered with fewer than 2 active DON!!', () => {
    const g = start({ costArea: { active: 1, rested: 4 } });
    expect(dec(g)?.kind).not.toBe('optional');
  });

  it('[Once Per Turn]: a second attack the same turn does not offer it', () => {
    const g = start({ costArea: { active: 6, rested: 0 } }, [V.c7, V.c7, V.c4]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    finishBattle(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7, 1),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).not.toBe('optional');
  });

  it('must not fire on your own attack', () => {
    const g = mk(
      { characters: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [restedCard(V.c4)] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(dec(g)?.kind).not.toBe('optional');
  });
});
