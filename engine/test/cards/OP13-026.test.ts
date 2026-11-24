/** OP13-026 Sunny-Kun. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision } from './helpers.ts';
import { canActivate } from './helpers-op16g1.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-026';

describe('OP13-026 Sunny-Kun', () => {
  const start = (p1 = {}) => mk({ characters: [ID], ...p1 });
  const act = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });
  const sunny = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

  it('[Activate: Main] [Once Per Turn]: rests 1 DON!!; this Character gains +2000 power', () => {
    const g = start();
    act(g);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(g.power(sunny(g))).toBe(4000);
    expectDecision(g, 'main', 'p1');
  });

  it("lasts until the end of your opponent's next turn, and no longer", () => {
    const g = start();
    act(g);
    g.act({ type: 'endTurn' });
    expect(g.power(sunny(g))).toBe(4000); // during the opponent's turn
    g.act({ type: 'endTurn' });
    expect(g.power(sunny(g))).toBe(2000);
  });

  it('Once Per Turn: cannot be activated twice', () => {
    const g = start();
    act(g);
    expect(canActivate(g, sunny(g), 'main')).toBe(false);
  });

  it('needs an active DON!! to rest: with none active it cannot be activated', () => {
    const g = start({ costArea: { active: 0, rested: 10 } });
    expect(canActivate(g, sunny(g), 'main')).toBe(false);
    const h = start({ costArea: { active: 1, rested: 9 } });
    expect(canActivate(h, sunny(h), 'main')).toBe(true);
  });

  it('boosts only itself, and Sunny-Kun stays active (no rest cost on the Character)', () => {
    const g = start({ characters: [ID, 'OP02-084'] });
    act(g);
    expect(g.power(g.find('p1', 'characters', 'OP02-084'))).toBe(3000);
    expect(g.card(sunny(g)).rested).toBe(false);
  });
});
