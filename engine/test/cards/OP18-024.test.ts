/** OP18-024 Kokoro. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, trash } from './helpers.ts';
import { mk, PLAIN_PURPLE } from './helpers-op18-g1.ts';

const ID = 'OP18-024';
const board = (leaderRested: boolean) =>
  mk({ leader: { card: PLAIN_PURPLE, rested: leaderRested }, characters: [ID] });

describe('OP18-024 Kokoro', () => {
  it('has [Blocker]', () => {
    const g = board(false);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[End of Your Turn] trash it: set your Leader as active', () => {
    const g = board(true);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('declined: Kokoro stays and the Leader stays rested', () => {
    const g = board(true);
    g.act({ type: 'endTurn' });
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('with the Leader already active the cost can still be paid and nothing else changes', () => {
    const g = board(false);
    g.act({ type: 'endTurn' });
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it("it does not fire at the end of the opponent's turn", () => {
    const g = board(true);
    g.act({ type: 'endTurn' });
    decline(g);
    g.act({ type: 'endTurn' });
    expect(dec(g)?.kind).not.toBe('optional');
  });
});
