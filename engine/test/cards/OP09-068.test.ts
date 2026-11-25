/** OP09-068 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { decline, don, expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { countOptions, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-068';
const start = (active = 3, rested = true) =>
  game(
    { leader: PLAIN_PURPLE, characters: [{ card: ID, rested }], costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c3] },
  );
const chopper = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'characters', ID));

describe('OP09-068 Tony Tony.Chopper', () => {
  it("[End of Your Turn] returning DON!!: sets itself active and gains [Blocker] until the end of the opponent's next turn", () => {
    const g = start();
    g.act({ type: 'endTurn' });
    expectDecision(g, 'optional', 'p1');
    payReturn(g, 1);
    // Now the opponent's turn.
    expectDecision(g, 'main', 'p2');
    expect(chopper(g).rested).toBe(false);
    expect(chopper(g).keywords).toContain('Blocker');
    expect(don(g, 'p1').deck).toBe(8);
    // It ends with the end of the opponent's turn.
    g.act({ type: 'endTurn' });
    expect(chopper(g).keywords).not.toContain('Blocker');
  });

  it('declining the cost: stays rested, no [Blocker]', () => {
    const g = start();
    g.act({ type: 'endTurn' });
    decline(g);
    expectDecision(g, 'main', 'p2');
    expect(chopper(g).rested).toBe(true);
    expect(chopper(g).keywords).not.toContain('Blocker');
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('already active: the [Blocker] is still gained ("Then" is not "if you do")', () => {
    const g = start(3, false);
    g.act({ type: 'endTurn' });
    payReturn(g, 1);
    expect(chopper(g).rested).toBe(false);
    expect(chopper(g).keywords).toContain('Blocker');
  });

  it("only at the end of your own turn, not the opponent's", () => {
    const g = start();
    g.act({ type: 'endTurn' });
    decline(g);
    g.act({ type: 'endTurn' });
    // p1's turn again: no question at the end of the opponent's turn.
    expectDecision(g, 'main', 'p1');
  });

  it('the count is 1 to every DON!! on the field', () => {
    const g = start(4);
    g.act({ type: 'endTurn' });
    g.act({ type: 'optional', accept: true });
    expect(countOptions(g)).toEqual(['1', '2', '3', '4']);
  });
});
