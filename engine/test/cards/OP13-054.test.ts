/** OP13-054 Yamato. */
import { describe, expect, it } from 'vitest';
import { BLUE, don, hand, play, times } from './helpers.ts';
import { expectDecision, mk, settle } from './helpers-op13g2.ts';

const ID = 'OP13-054';

// Yamato costs 5: with 7 active and 3 rested, 8 are rested afterwards.
const start = (life: number) =>
  mk({ hand: [ID], life: times(life, BLUE), costArea: { active: 7, rested: 3 } });

describe('OP13-054 Yamato', () => {
  it('[On Play]: with 3 Life cards (boundary), draws 2, then gives up to 1 rested DON!! to your Leader', () => {
    const g = start(3);
    play(g, ID);
    settle(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(7); // 8 rested minus the one given
  });

  it('must not draw nor give with 4 Life cards ("Then" is inside the "If")', () => {
    const g = start(4);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g, 'p1').rested).toBe(8);
  });

  it('with 0 Life it fires as well (3 or less)', () => {
    const g = start(0);
    play(g, ID);
    settle(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('the DON!! goes to the Leader, not to Yamato', () => {
    const g = start(1);
    play(g, ID);
    settle(g);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });
});
