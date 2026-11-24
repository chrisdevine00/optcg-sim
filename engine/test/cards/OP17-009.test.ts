/** OP17-009 Haruta. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { P2000_A, P2000_B, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-009';

describe('OP17-009 Haruta', () => {
  const start = (opp: Parameters<typeof game>[1]['characters']) =>
    game(
      { leader: RED_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play] K.O. up to 1 of your opponent's Characters with 2000 base power or less", () => {
    const g = start([P2000_A, V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', P2000_A)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([P2000_A]);
  });

  it('a Character with 3000 base power is not a candidate; with no candidate nothing happens', () => {
    const g = start([V.c1]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"up to 1": at most one K.O., and it may K.O. none', () => {
    const g = start([P2000_A, P2000_B]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', P2000_B)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([P2000_A]);
    const g2 = start([P2000_A]);
    play(g2, ID);
    none(g2);
    expect(g2.zone('p2', 'characters')).toHaveLength(1);
  });

  it("[Opponent's Turn] +3000 power only during the opponent's turn (5000 to 8000)", () => {
    const g = start([]);
    play(g, ID);
    const haruta = g.find('p1', 'characters', ID);
    expect(g.power(haruta)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.power(haruta)).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(haruta)).toBe(5000);
  });

  it('only opposing Characters are candidates for the K.O. (never your own)', () => {
    const g = game(
      { leader: RED_LEADER, hand: [ID], characters: [P2000_A], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });
});
