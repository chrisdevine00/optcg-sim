/** OP15-032 Brook. OPEN-QUESTIONS M4b-1 (the opponent's DON!! cards are "cards"). */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { cardsOf, COST10, donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP15-032';

describe('OP15-032 Brook', () => {
  const start = () =>
    game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(6) },
      { leader: PLAIN_BLUE, characters: [V.c3], ...donArea(2) },
    );

  it("[On Play]: rest up to 1 of your opponent's Characters", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it("[On Play]: the opponent's Leader and active DON!! cards are candidates too (M4b-1)", () => {
    const l = start();
    play(l, ID);
    pick(l, [l.leader('p2')]);
    expect(l.card(l.leader('p2')).rested).toBe(true);

    const d = start();
    play(d, ID);
    d.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(don(d, 'p2').active).toBe(1);
    expect(don(d, 'p2').rested).toBe(1);
  });

  it('[On Play]: "up to 1" may rest nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(don(g, 'p2').active).toBe(2);
  });

  const reset = (leader: string) => {
    const g = game(
      {
        leader,
        characters: [ID, { card: SHC.franky4, rested: true }, { card: COST10, rested: true }],
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'reset' });
    return g;
  };

  it('[Activate: Main]: trash this Character; with a {Straw Hat Crew} Leader set a base-cost-8-or-less Character active', () => {
    const g = reset(SHC_LEADER);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
    expectDecision(g, 'choose', 'p1');
    // The base-cost-10 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', SHC.franky4)]);
    expect(g.card(g.find('p1', 'characters', SHC.franky4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', COST10)).rested).toBe(true);
  });

  it('[Activate: Main]: the trash is a cost; without a {Straw Hat Crew} Leader nothing is set active', () => {
    const g = reset(PLAIN_PURPLE);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', SHC.franky4)).rested).toBe(true);
  });
});
