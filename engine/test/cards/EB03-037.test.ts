/** EB03-037 Lim. */
import { describe, expect, it } from 'vitest';
import { expectDecision, play, V } from './helpers.ts';
import { mk, ODYSSEY4, ODYSSEY_LEADER } from './helpers-eb03g2.ts';

const ID = 'EB03-037';
const area = (active: number) => ({ costArea: { active, rested: 0 } });

describe('EB03-037 Lim', () => {
  it('[On Play] with 7+ DON!!: all your {ODYSSEY} Leader and Characters gain +1000, others do not', () => {
    const g = mk({ leader: ODYSSEY_LEADER, hand: [ID], characters: [ODYSSEY4, V.c3], ...area(10) });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ODYSSEY4))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000); // herself: 5000 + 1000
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('boundary: exactly 7 DON!! fires (rested ones count), 6 does not', () => {
    const g = mk({ leader: ODYSSEY_LEADER, hand: [ID], costArea: { active: 5, rested: 2 } });
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(6000);
    const h = mk({ leader: ODYSSEY_LEADER, hand: [ID], costArea: { active: 5, rested: 1 } });
    play(h, ID);
    expect(h.power(h.leader('p1'))).toBe(5000);
    expect(h.power(h.find('p1', 'characters', ID))).toBe(5000);
  });

  it('DON!! given to a Character counts toward the 7', () => {
    const g = mk({
      leader: ODYSSEY_LEADER,
      hand: [ID],
      costArea: { active: 6, rested: 0 },
      characters: [{ card: V.c1, don: 1 }],
    });
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("lasts until the end of the opponent's next End Phase, then ends", () => {
    const g = mk({ leader: ODYSSEY_LEADER, hand: [ID], ...area(10) });
    play(g, ID);
    g.act({ type: 'endTurn' });
    // The opponent's turn 4: the boost is still on (their attack would face 6000).
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    // Back on p1's turn 5 it is gone.
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('only the Characters on the field when it resolves: one played later gets nothing', () => {
    const g = mk({ leader: ODYSSEY_LEADER, hand: [ID, ODYSSEY4], ...area(10) });
    play(g, ID);
    play(g, ODYSSEY4);
    expect(g.power(g.find('p1', 'characters', ODYSSEY4))).toBe(6000);
  });
});
