/** OP10-074 Pica. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, payDon, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { finishBattle, mk, restedCard, runMine } from './helpers-a10g2.ts';

const ID = 'OP10-074';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP10-074 Pica', () => {
  const start = (p1: Parameters<typeof mk>[0] = {}) => {
    const g = mk(
      { characters: [ID, V.c1], costArea: { active: 3, rested: 0 }, ...p1 },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', ID)]);
    return g;
  };

  it("[Once Per Turn] instead of being K.O.'d by your opponent's effect, you may rest 2 of your active DON!!", () => {
    const g = start();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    expect(chars(g)).toContain(ID);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('declining lets the K.O. happen and rests no DON!!', () => {
    const g = start();
    decline(g);
    expect(chars(g)).not.toContain(ID);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('[Once Per Turn]: a second K.O. the same turn is not replaced', () => {
    const g = start({ costArea: { active: 5, rested: 0 } });
    accept(g);
    payDon(g);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(ID);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('boundary: 2 active DON!! is enough, 1 is not (rested DON!! do not count)', () => {
    const a = start({ costArea: { active: 2, rested: 0 } });
    expectDecision(a, 'optional', 'p1');
    const b = start({ costArea: { active: 1, rested: 5 } });
    expect(dec(b)?.kind).toBe('main');
    expect(chars(b)).not.toContain(ID);
  });

  it("is not replaced when K.O.'d in battle or by your own effect", () => {
    const g = mk(
      { characters: [restedCard(ID)], costArea: { active: 3, rested: 0 } },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expect(chars(g)).not.toContain(ID);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });

    const h = mk({ characters: [ID], costArea: { active: 3, rested: 0 } });
    runMine(h, { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    expect(chars(h)).not.toContain(ID);
    expect(don(h, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('does not protect another Character', () => {
    const g = mk(
      { characters: [ID, V.c1], costArea: { active: 3, rested: 0 } },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).toEqual([ID]);
  });
});
