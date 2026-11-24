/** OP13-031 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { BLUE, accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-031';

describe('OP13-031 Trafalgar Law', () => {
  const start = (p1 = {}) => mk({ hand: [ID, V.c5, V.c6], characters: [V.c2], ...p1 });
  const mine = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);
  const handOf = (g: ReturnType<typeof mk>) => g.zone('p1', 'hand').map((c) => c.card);

  it('[On Play]: returns 1 of your Characters to hand: plays up to 1 Character with cost 5 or less from your hand rested', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    // Hand now: V.c5, V.c6, and the returned V.c2. Cost 6 is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(mine(g)).toEqual([ID, V.c5]);
    expect(g.card(g.find('p1', 'characters', V.c5)).rested).toBe(true);
    expect(handOf(g)).toEqual([V.c6, V.c2]);
  });

  it('the returned Character may be the one played again (it is in hand when the play is chosen)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(mine(g)).toEqual([ID, V.c2]);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
  });

  it('Law may return himself (a Character of yours); then he is in hand and a cost 5 Character is played', () => {
    const g = start({ characters: [] });
    play(g, ID);
    accept(g);
    // The only Character is Law: chosen automatically.
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(mine(g)).toEqual([V.c5]);
    expect(handOf(g)).toContain(ID);
  });

  it('"you may": declining returns and plays nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(mine(g)).toEqual([V.c2, ID]);
    expect(handOf(g)).toEqual([V.c5, V.c6]);
  });

  it('"up to 1": after paying the cost the play may be skipped', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    none(g);
    expect(mine(g)).toEqual([ID]);
    expectDecision(g, 'main', 'p1');
  });

  it('[Blocker] only with 1 or less Life: 1 and 0 Life have it, 2 do not', () => {
    const has = (life: string[]) => {
      const g = mk({ characters: [ID], life });
      return g.card(g.find('p1', 'characters', ID)).keywords;
    };
    expect(has([BLUE])).toContain('Blocker');
    expect(has([])).toContain('Blocker');
    expect(has([BLUE, BLUE])).not.toContain('Blocker');
  });
});
