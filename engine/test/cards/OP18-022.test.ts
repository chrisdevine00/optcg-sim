/** OP18-022 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, expectDecision } from './helpers.ts';
import { finishBattle } from './helpers-op14g1.ts';
import { mk } from './helpers-op18-g1.ts';

const ID = 'OP18-022';
const board = (given: number) => mk({ leader: { card: ID, don: given } });
const swing = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

describe('OP18-022 Monkey.D.Luffy (Leader)', () => {
  it('[DON!! x3][When Attacking]: may set this Leader as active (it was rested by attacking)', () => {
    const g = board(3);
    swing(g);
    expectDecision(g, 'optional', 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    finishBattle(g);
  });

  it('declined: the Leader stays rested', () => {
    const g = board(3);
    swing(g);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('with only 2 DON!! given the ability does not fire', () => {
    const g = board(2);
    swing(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('if you do: the Leader will not become active in your next Refresh Phase', () => {
    const g = board(3);
    swing(g);
    accept(g);
    finishBattle(g);
    // Something rests the Leader again before the turn ends.
    g.state = applyOp(g.state, { op: 'rest', card: g.leader('p1') }).state;
    g.act({ type: 'endTurn' }); // p2's turn
    g.act({ type: 'endTurn' }); // p1's Refresh Phase
    expect(g.card(g.leader('p1')).rested).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // the turn after: refreshed normally
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('declined: the next Refresh Phase is normal', () => {
    const g = board(3);
    swing(g);
    decline(g);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});
