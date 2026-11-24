/** OP14-031 Nami. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  don,
  expectDecision,
  game,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  setMost,
  V,
} from './helpers.ts';
import { COST10, COST8, donArea, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP14-031';

describe('OP14-031 Nami', () => {
  const start = () =>
    game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(4, 3) },
      { leader: PLAIN_BLUE, characters: [COST8, V.c7, COST10, BLUE] },
    );

  it('has [Blocker] (printed keyword)', () => {
    const g = start();
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Play]: rest up to 2 of your opponent's Characters with a cost of 8 or less", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // The cost-10 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    const a = g.find('p2', 'characters', COST8);
    const b = g.find('p2', 'characters', V.c7);
    pick(g, [a, b]);
    expect(g.card(a).rested).toBe(true);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', COST10)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', BLUE)).rested).toBe(false);
  });

  it('[On Play]: then sets up to 5 of your DON!! as active at the end of this turn, not before', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', COST8)]);
    // Right after the play: the 4 that paid for Nami are rested, nothing is set active yet.
    expect(don(g, 'p1').active).toBe(0);
    expect(don(g, 'p1').rested).toBe(7);
    g.act({ type: 'endTurn' });
    setMost(g);
    expect(don(g, 'p1').active).toBe(5);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('[On Play]: the DON!! are still set active at the end of the turn when no Character was rested', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    setMost(g);
    expect(don(g, 'p1').active).toBe(5);
  });

  it('[On Play]: "up to 5": at the End Phase a count is asked; 2 sets two, 0 none (OP14-R2)', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 5 });
    const h = start();
    play(h, ID);
    none(h);
    h.act({ type: 'endTurn' });
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });
});
