/** OP14-050 Chew. */
import { describe, expect, it } from 'vitest';
import { hand, play } from './helpers.ts';
import { FM_LEADER, mine, OTHER_LEADER } from './helpers-op14g2.ts';

const ID = 'OP14-050';

describe('OP14-050 Chew', () => {
  it('[On Play]: with a {Fish-Man} Leader, draws 1 card', () => {
    const g = mine(FM_LEADER, { hand: [ID] });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });

  it('[On Play]: without a {Fish-Man} Leader, draws nothing', () => {
    const g = mine(OTHER_LEADER, { hand: [ID] });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('only the Leader’s type counts: a {Fish-Man} Character does not enable it', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], characters: ['OP03-007'] });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
