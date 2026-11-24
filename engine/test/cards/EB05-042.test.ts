/** EB05-042 Shinobu. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { donArea } from './helpers-luffyace.ts';

const SHINOBU = 'EB05-042';

describe('EB05-042 Shinobu', () => {
  it('[On Play] draws 2, then trashes 2 cards from hand', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [SHINOBU, V.c1, V.c2], ...donArea(4) },
      { leader: PLAIN_BLUE },
    );
    play(g, SHINOBU);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(4);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('the freshly drawn cards can be the ones trashed', () => {
    const g = game({ leader: PLAIN_BLUE, hand: [SHINOBU], ...donArea(4) }, { leader: PLAIN_BLUE });
    play(g, SHINOBU);
    pick(
      g,
      g.zone('p1', 'hand').map((c) => c.instance),
    );
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('draws from the top of a short deck, then trashes those two', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [SHINOBU], deck: [V.c1, V.c2, V.c3], ...donArea(4) },
      { leader: PLAIN_BLUE },
    );
    play(g, SHINOBU);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });
});
