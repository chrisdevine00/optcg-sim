/** OP15-081 Sanji. */
import { describe, expect, it } from 'vitest';
import { dec, play, trash, V } from './helpers.ts';
import { mine, OTHER_LEADER, STRAW_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-081';

describe('OP15-081 Sanji', () => {
  const start = (leader: string, deck: string[]) => mine(leader, { hand: [ID], deck });
  const deck7 = [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7];

  it('[On Play] with a {Straw Hat Crew} Leader, trash 5 cards from the top of your deck', () => {
    const g = start(STRAW_LEADER, deck7);
    play(g, ID);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3, V.c4, V.c5].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c6, V.c7]);
  });

  it('the cards are trashed face-up from the top in order (top card first)', () => {
    const g = start(STRAW_LEADER, deck7);
    play(g, ID);
    expect(g.zone('p1', 'trash')).toHaveLength(5);
    expect(g.zone('p1', 'deck')[0]?.card).toBe(V.c6);
  });

  it('without a {Straw Hat Crew} Leader nothing is trashed', () => {
    const g = start(OTHER_LEADER, deck7);
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });

  it('the opponent deck is untouched', () => {
    const g = start(STRAW_LEADER, deck7);
    const before = g.zone('p2', 'deck').length;
    play(g, ID);
    expect(g.zone('p2', 'deck')).toHaveLength(before);
  });

  it('milling the whole deck (5 or fewer cards) ends the game at once (RL-26)', () => {
    const g = start(STRAW_LEADER, [V.c1, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    expect(dec(g)).toBeNull();
    expect(g.zone('p1', 'deck')).toHaveLength(0);
  });
});
