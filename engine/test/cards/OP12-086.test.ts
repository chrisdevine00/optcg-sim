/** OP12-086 Koala. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import { cardsIn, mk, offered, OTHER_LEADER, RA2, RA5, V } from './helpers-op12g3.ts';

const ID = 'OP12-086';
/** [Nico Robin] (cost 3, {FILM}{Straw Hat Crew}): text inert in a deck. */
const ROBIN = 'OP02-037';

describe('OP12-086 Koala', () => {
  it('[On Play] with a "Revolutionary Army" Leader: looks at 3, adds up to 1 Revolutionary Army card, trashes the rest', () => {
    const g = mk({ hand: [ID], deck: [RA5, V.c1, V.c2, V.c3, V.c4] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(offered(g)).toEqual([g.find('p1', 'deck', RA5)]);
    pick(g, [g.find('p1', 'deck', RA5)]);
    expect(hand(g, 'p1')).toEqual([RA5]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3, V.c4]);
  });

  it('[Koala] itself is excluded, but [Nico Robin] qualifies whatever its type', () => {
    const g = mk({ hand: [ID], deck: [RA2, ROBIN, V.c3, V.c4] });
    play(g, ID);
    expect(offered(g)).toEqual([g.find('p1', 'deck', ROBIN)]);
    pick(g, [g.find('p1', 'deck', ROBIN)]);
    expect(hand(g, 'p1')).toEqual([ROBIN]);
    expect(trash(g, 'p1').sort()).toEqual([RA2, V.c3].sort());
  });

  it('"up to 1": may take nothing, and then all 3 looked-at cards are trashed', () => {
    const g = mk({ hand: [ID], deck: [RA5, V.c1, V.c2, V.c3] });
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(trash(g, 'p1').sort()).toEqual([RA5, V.c1, V.c2].sort());
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('only the top 3 are looked at: a qualifying 4th card is out of reach and stays in the deck', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, RA5, V.c4] });
    play(g, ID);
    expect(offered(g)).toHaveLength(0);
    none(g);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([RA5, V.c4]);
    expect(trash(g, 'p1')).toHaveLength(3);
  });

  it('must not fire with a Leader that is not "Revolutionary Army": no look at the deck', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID], deck: [RA5, V.c1, V.c2, V.c3] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(4);
  });
});
