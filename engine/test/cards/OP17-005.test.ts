/** OP17-005 Edward.Newgate (Character). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { play } from './helpers.ts';
import { BIG10, MULTI_WANO_LEADER, NEWGATE_LEADER, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-005';

describe('OP17-005 Edward.Newgate', () => {
  const start = (leader: string, opp: Parameters<typeof game>[1]['characters'], active = 10) =>
    game(
      { leader, hand: [ID], costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it('in hand: -4 cost while your opponent has a Character with 10000 power or more', () => {
    const g = start(RED_LEADER, [BIG10], 6);
    const id = g.find('p1', 'hand', ID);
    expect(g.card(id).cost).toBe(6);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(true);
  });

  it('with no such Character the card costs its printed 10', () => {
    const g = start(RED_LEADER, [V.c7], 6);
    const id = g.find('p1', 'hand', ID);
    expect(g.card(id).cost).toBe(10);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(false);
  });

  it('[On Play] a monocolored Leader has base power 8000 until the end of the opponent next End Phase', () => {
    const g = start(RED_LEADER, [BIG10], 6);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(8000); // still during the opponent's turn
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000); // the end of the opponent's End Phase has passed
  });

  it('it replaces the base power (a 6000 Leader becomes 8000, not 14000)', () => {
    const g = start(NEWGATE_LEADER, [], 10);
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('a multicolored Leader is not affected', () => {
    const g = start(MULTI_WANO_LEADER, [], 10);
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
