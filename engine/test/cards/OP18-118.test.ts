/** OP18-118 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { candidates } from './helpers-a10g1.ts';
import { don, expectDecision, game, pick, play, setMost, V } from './helpers.ts';
import { FF2, PLAIN_BLUE, PLAIN_PURPLE, SHC3 } from './helpers-op18.ts';

const ID = 'OP18-118';

describe('OP18-118 Monkey.D.Luffy', () => {
  it('[On Play] sets up to 3 DON!! active, then any opponent Character cannot be rested', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 9, rested: 1 } },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c1] },
    );
    play(g, ID);
    setMost(g);
    expect(don(g, 'p1').active).toBe(3);
    expect(candidates(g).length).toBe(2); // no cost limit
    pick(g, [g.find('p2', 'characters', V.c7)]);
    const t = g.find('p2', 'characters', V.c7);
    g.state = applyOp(g.state, { op: 'rest', card: t }).state;
    expect(g.card(t).rested).toBe(false);
  });

  it('[End of Your Turn] sets up to 1 {Water Seven} card active', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [
          { card: ID, rested: true },
          { card: FF2, rested: true },
          { card: SHC3, rested: true },
        ],
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'characters', ID), g.find('p1', 'characters', FF2)].sort(),
    );
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', FF2)).rested).toBe(true);
  });
});
