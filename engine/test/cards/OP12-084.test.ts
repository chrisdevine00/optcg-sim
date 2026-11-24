/** OP12-084 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import { expectDecision, play, trash } from './helpers.ts';
import { cardsIn, mk, OTHER_LEADER, rep, V } from './helpers-op12g3.ts';

const ID = 'OP12-084';
const deck = [V.c1, V.c2, V.c3, V.c4, V.c5];

describe('OP12-084 Emporio.Ivankov', () => {
  it('[On Play] with a "Revolutionary Army" Leader: trashes 3 cards from the top of the deck, in order', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([V.c3, V.c2, V.c1]);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4, V.c5]);
    expectDecision(g, 'main', 'p1');
  });

  it('mills exactly 3, not 2 or 4', () => {
    const g = mk({ hand: [ID], deck: rep(10, V.c1) });
    play(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it('a deck with fewer than 3 cards: trashes what is there', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2] });
    play(g, ID);
    expect(g.zone('p1', 'deck')).toHaveLength(0);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
  });

  it('must not fire with a Leader that is not "Revolutionary Army"', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID], deck });
    play(g, ID);
    expect(cardsIn(g, 'p1', 'deck')).toEqual(deck);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
