/** OP13-065 Shanks. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, play, V } from './helpers.ts';
import { idsOf, mine, pickableCards, pickCard, RP, settle, SHANKS } from './helpers-op13g3.ts';

const ID = 'OP13-065';
const STAGE_RP = 'OP13-078';

describe('OP13-065 Shanks', () => {
  const start = (deck: string[]) => mine({ hand: [ID], deck }, {}, 3);

  it('[On Play] look at 5, reveal up to 1 {Roger Pirates} card other than [Shanks] to hand, the rest to the bottom', () => {
    const g = start([V.c1, RP, SHANKS, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    // Only the Roger Pirates card that is not [Shanks] can be taken.
    expect(pickableCards(g)).toEqual([RP]);
    pickCard(g, RP);
    settle(g);
    expect(hand(g, 'p1')).toEqual([RP]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, SHANKS, V.c2, V.c3].sort());
  });

  it('"up to 1": may take nothing; all 5 go to the bottom in any order', () => {
    const g = start([V.c1, RP, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(V.c5);
    expect(deck).toHaveLength(6);
  });

  it('any category counts: a {Roger Pirates} Stage can be taken', () => {
    const g = start([STAGE_RP, V.c1, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([STAGE_RP]);
  });

  it('cards beyond the fifth are not looked at', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, RP]);
    play(g, ID);
    // Nothing among the top 5 qualifies: nothing to pick.
    expect(pickableCards(g)).toEqual([]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(RP);
  });

  it('with a deck of fewer than 5 cards it looks at what is there', () => {
    const g = start([RP, V.c1]);
    play(g, ID);
    pickCard(g, RP);
    settle(g);
    expect(hand(g, 'p1')).toEqual([RP]);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c1]);
  });
});
