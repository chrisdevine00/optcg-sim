/** OP13-007 Ace & Sabo & Luffy. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, V } from './helpers.ts';
import { canActivate } from './helpers-op16g1.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-007';

describe('OP13-007 Ace & Sabo & Luffy', () => {
  const start = (p1 = {}, p2 = {}) =>
    mk({ characters: [ID, V.c3], ...p1 }, { characters: [V.c4, V.c7], ...p2 });
  const act = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });

  it('[Activate: Main]: gives 1 active DON!! to your Leader, trashes itself: an opposing Character gets -3000', () => {
    const g = start();
    act(g);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    expect(don(g, 'p1')).toMatchObject({ active: 9, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('the DON!! may go to a Character instead', () => {
    const g = start();
    act(g);
    const c3 = g.find('p1', 'characters', V.c3);
    pick(g, [c3]);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(c3).don).toBe(1);
    expect(g.power(c3)).toBe(6000);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(6000);
  });

  it('the cost needs an ACTIVE DON!! card: all rested means no activation', () => {
    const g = start({ costArea: { active: 0, rested: 10 } });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'main')).toBe(false);
    const h = start({ costArea: { active: 1, rested: 9 } });
    expect(canActivate(h, h.find('p1', 'characters', ID), 'main')).toBe(true);
  });

  it('"up to 1": the -3000 may be skipped, but the cost is paid', () => {
    const g = start();
    act(g);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expectDecision(g, 'main', 'p1');
  });

  it('only opposing Characters are targets (not an opposing Leader), and it works with none: the cost is still paid', () => {
    const g = start({}, { characters: [] });
    act(g);
    pick(g, [g.leader('p1')]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('can be activated the turn it is played (no rest cost)', () => {
    const g = start({ characters: [{ card: ID, playedThisTurn: true }] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'main')).toBe(true);
  });
});
