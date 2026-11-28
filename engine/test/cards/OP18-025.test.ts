/** OP18-025 Gonbe. */
import { describe, expect, it } from 'vitest';
import { mk, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-025';
const board = (gonbeRested: boolean, leaderRested = true) =>
  mk({
    leader: { card: PLAIN_PURPLE, rested: leaderRested },
    characters: [{ card: ID, rested: gonbeRested }],
  });

describe('OP18-025 Gonbe', () => {
  it('[End of Your Turn] if this Character is rested, set your Leader as active', () => {
    const g = board(true);
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('active Gonbe: the Leader stays rested', () => {
    const g = board(false);
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('Gonbe itself stays rested (only the Leader is set)', () => {
    const g = board(true);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('an already active Leader is unchanged', () => {
    const g = board(true, false);
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it("not at the end of the opponent's turn", () => {
    const g = board(true);
    g.act({ type: 'endTurn' }); // p1's end: Leader set active
    g.act({ type: 'endTurn' }); // p2's end
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});
