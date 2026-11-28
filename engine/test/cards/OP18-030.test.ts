/** OP18-030 Nami. */
import { describe, expect, it } from 'vitest';
import { game } from './helpers.ts';
import { PLAIN_BLUE, PLAIN_PURPLE } from './helpers-op18-g2.ts';

const ID = 'OP18-030';
const board = (card: string | { card: string; rested: boolean }, opp: boolean) =>
  game(
    { leader: PLAIN_PURPLE, characters: [card] },
    { leader: PLAIN_BLUE },
    opp ? { turn: 4, activePlayer: 'p2' } : {},
  );

describe('OP18-030 Nami', () => {
  it("on your opponent's turn a rested Nami has -2000 power", () => {
    const g = board({ card: ID, rested: true }, true);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  it("an active Nami keeps her 6000 on your opponent's turn", () => {
    const g = board(ID, true);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('on your own turn a rested Nami is 6000', () => {
    const g = board({ card: ID, rested: true }, false);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('being attacked while rested: the debuff is live during the opponent turn only', () => {
    const g = board({ card: ID, rested: true }, true);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    g.act({ type: 'endTurn' });
    // p1's turn: Refresh makes her active, 6000 again.
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });
});
