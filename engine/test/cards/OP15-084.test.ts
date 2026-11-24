/** OP15-084 Dr. Hogback. */
import { describe, expect, it } from 'vitest';
import { BLUE, play, V } from './helpers.ts';
import {
  donArea,
  fill,
  koByBattle,
  mine,
  names,
  OTHER_LEADER,
  TBP_LEADER,
} from './helpers-op15g3.ts';

const ID = 'OP15-084';

describe('OP15-084 Dr. Hogback', () => {
  const played = (leader: string, deck = fill(10, V.c1)) => {
    const g = mine({ leader, hand: [ID], deck, ...donArea(1) });
    play(g, ID);
    return g;
  };

  it('[On Play] with a {Thriller Bark Pirates} Leader trashes exactly 5 cards from the top of the deck', () => {
    const g = played(TBP_LEADER, [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7]);
    expect(names(g, 'p1', 'trash').sort()).toEqual([V.c1, V.c2, V.c3, V.c4, V.c5].sort());
    expect(names(g, 'p1', 'deck')).toEqual([V.c6, V.c7]);
  });

  it('[On Play] with a Leader of another type trashes nothing', () => {
    const g = played(OTHER_LEADER);
    expect(names(g, 'p1', 'trash')).toEqual([]);
    expect(names(g, 'p1', 'deck')).toHaveLength(10);
  });

  describe('[On K.O.]', () => {
    const koed = (handSize: number) =>
      koByBattle({ leader: OTHER_LEADER, hand: fill(handSize, BLUE), deck: fill(5, V.c1) }, ID);

    it('draws 1 card with 6 cards in hand (the boundary)', () => {
      const g = koed(6);
      expect(g.zone('p1', 'hand')).toHaveLength(7);
      expect(names(g, 'p1', 'trash')).toEqual([ID]);
    });

    it('draws 1 card with an empty hand', () => {
      const g = koed(0);
      expect(g.zone('p1', 'hand')).toHaveLength(1);
    });

    it('must not draw with 7 cards in hand', () => {
      const g = koed(7);
      expect(g.zone('p1', 'hand')).toHaveLength(7);
      expect(g.zone('p1', 'deck')).toHaveLength(5);
    });
  });
});
