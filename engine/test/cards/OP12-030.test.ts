/** OP12-030 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, option, play, V } from './helpers.ts';
import { at, mk } from './helpers-op12g1.ts';

const ID = 'OP12-030';

describe('OP12-030 Dracule Mihawk', () => {
  const start = (hand: string[] = [ID, V.c7, V.c6, V.c3], costArea = { active: 10, rested: 0 }) =>
    mk({ hand, costArea });
  const canPlay = (g: ReturnType<typeof start>, card: string) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', card), player: 'p1' });

  it('has [Blocker] (printed)', () => {
    const g = start();
    play(g, ID);
    option(g, '0');
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: sets up to 4 DON!! as active (a count is asked)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // 8 DON!! were rested to pay the cost, so the full 4 are on offer (most first).
    option(g, '4');
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('a smaller count sets fewer; 0 sets none', () => {
    const g = start();
    play(g, ID);
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    const h = start();
    play(h, ID);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('then: Characters with a base cost of 7 or more cannot be played this turn (6 or less can)', () => {
    const g = start();
    play(g, ID);
    option(g, '4');
    expect(canPlay(g, V.c7)).toBe(false);
    expect(canPlay(g, V.c6)).toBe(true);
    expect(canPlay(g, V.c3)).toBe(true);
  });

  it('the restriction applies even when no DON!! was set active, and ends with the turn', () => {
    const g = start();
    play(g, ID);
    option(g, '0');
    expect(canPlay(g, V.c7)).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canPlay(g, V.c7)).toBe(true);
  });

  it('the restriction is not in force before Mihawk is played (control)', () => {
    const g = start();
    expect(canPlay(g, V.c7)).toBe(true);
  });
});
