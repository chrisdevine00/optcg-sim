/** OP12-095 Lindbergh. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { cardsIn, mk, OTHER_LEADER, RA2 } from './helpers-op12g3.ts';

const ID = 'OP12-095';

describe('OP12-095 Lindbergh', () => {
  it('with a "Revolutionary Army" Leader this Character gains +4 cost (4 becomes 8)', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
  });

  it('must not apply with another Leader: cost stays 4', () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it('[On Play] draws 1 card, then trashes 1 card from the hand of your choice', () => {
    const g = mk({ hand: [ID, RA2, V.c1], deck: [V.c2, V.c3] });
    play(g, ID);
    // Hand: RA2, V.c1 and the drawn V.c2. Any of the three may go.
    expect(hand(g, 'p1').sort()).toEqual([RA2, V.c1, V.c2].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1').sort()).toEqual([RA2, V.c1].sort());
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('[On Play] has no Leader condition: it works with another Leader', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID, V.c1], deck: [V.c2, V.c3] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('with only the drawn card in the hand it is the one asked about and trashed', () => {
    const g = mk({ hand: [ID], deck: [V.c2, V.c3] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});
