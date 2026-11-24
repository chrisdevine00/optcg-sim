/** OP14-039 Coffin Boat. */
import { describe, expect, it } from 'vitest';
import { dec, don, hand, play } from './helpers.ts';
import { FM_LEADER, MIHAWK, mine } from './helpers-op14g2.ts';

const ID = 'OP14-039';

const start = (leader: string) => mine(leader, { hand: [ID], costArea: { active: 1, rested: 4 } });

describe('OP14-039 Coffin Boat', () => {
  it('[On Play]: with [Dracule Mihawk] as Leader, draws 1 card', () => {
    const g = start(MIHAWK);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('[On Play]: without [Dracule Mihawk] as Leader, draws nothing', () => {
    const g = start(FM_LEADER);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('[End of Your Turn]: with [Dracule Mihawk] as Leader, sets up to 1 DON!! as active', () => {
    const g = start(MIHAWK);
    play(g, ID); // pays the 1 active DON!!
    expect(don(g, 'p1').active).toBe(0);
    g.act({ type: 'endTurn' });
    // Possibly a choice of which DON!! card to set active; answer with the first offer.
    while (dec(g)?.kind === 'choose' && dec(g)!.player === 'p1') {
      const pickAct = g.legal().find((a) => a.type === 'pick');
      if (pickAct) g.act(pickAct);
      else g.act({ type: 'done' });
    }
    // p1's DON!! is read now (it is p2's turn): 1 set active, 4 still rested.
    expect(don(g, 'p1').active).toBe(1);
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('[End of Your Turn]: without [Dracule Mihawk] as Leader, no DON!! is set active', () => {
    const g = start(FM_LEADER);
    play(g, ID);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p1').active).toBe(0);
    expect(don(g, 'p1').rested).toBe(5);
  });
});
