/** OP14-071 Pica. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision } from './helpers.ts';
import { DP_LEADER, game, OTHER_LEADER, PLAIN_BLUE } from './helpers-op14g3.ts';

const ID = 'OP14-071';

describe('OP14-071 Pica', () => {
  const start = (leader: string, turn: 3 | 4 = 3) =>
    game(
      { leader, characters: [ID], costArea: { active: 1, rested: 1 } },
      { leader: PLAIN_BLUE },
      turn === 4 ? { turn: 4, activePlayer: 'p2' } : {},
    );

  it('[End of Your Turn] with a {Donquixote Pirates} Leader: add up to 1 DON!! and set it as active', () => {
    const g = start(DP_LEADER);
    g.act({ type: 'endTurn' });
    addMost(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(3);
  });

  it('the new DON!! is active (it stays active; the rested one stays rested until the next Refresh)', () => {
    const g = start(DP_LEADER);
    g.act({ type: 'endTurn' });
    addMost(g);
    // The next turn is p2's: p1's DON!! are not refreshed yet.
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('"up to 1": may add none', () => {
    const g = start(DP_LEADER);
    g.act({ type: 'endTurn' });
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with a Leader that is not {Donquixote Pirates} nothing is asked', () => {
    const g = start(OTHER_LEADER);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p1').deck).toBe(8);
    expect(dec(g)?.kind).not.toBe('choose');
  });

  it("does not fire at the end of your opponent's turn", () => {
    const g = start(DP_LEADER, 4);
    g.act({ type: 'endTurn' });
    // p1's own next DON!! Phase adds 2 (8 to 6); Pica added nothing.
    expect(don(g, 'p1').deck).toBe(6);
  });
});
