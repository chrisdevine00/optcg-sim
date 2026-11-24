/** OP12-040 Kuzan (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { EVENT, mine, opp, plantOpponentEffect } from './helpers-op12g2.ts';

const ID = 'OP12-040';
const ZEPHYR = 'OP12-046'; // [On Play] Trash 2 cards from your hand. {Navy}
const KUZAN_C = 'OP12-043'; // {Navy}, cost 6: [On Play] You may trash 1 card from your hand: ...
const PATTY = 'OP12-074'; // {East Blue}, not Navy: You may trash 1 Event from your hand: ...

describe('OP12-040 Kuzan', () => {
  it("draws cards equal to the number trashed by your Navy card's effect (2 trashed, draw 2)", () => {
    const g = mine({ leader: ID, hand: [ZEPHYR, V.c1, V.c2, V.c3] });
    play(g, ZEPHYR);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual(expect.arrayContaining([V.c1, V.c2]));
    // V.c3 stays; two cards drawn from the deck.
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(hand(g, 'p1')).toContain(V.c3);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('with only 1 card left to trash, the draw equals the 1 card trashed', () => {
    const g = mine({ leader: ID, hand: [ZEPHYR, V.c1] });
    play(g, ZEPHYR);
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });

  it('a card trashed as the COST of a Navy card counts (M6b-Q31: a cost is part of the effect)', () => {
    const g = mine({ leader: ID, hand: [KUZAN_C, V.c1], costArea: { active: 6, rested: 0 } });
    play(g, KUZAN_C);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(1); // drew 1
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });

  it('must not fire for a card that is not {Navy} (Patty trashes an Event as a cost)', () => {
    const g = mine({ leader: ID, hand: [PATTY, EVENT] });
    play(g, PATTY);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it("must not fire when the opponent's effect makes you trash a card", () => {
    const g = mine({ leader: ID, hand: [V.c1, V.c2] }, {}, opp);
    plantOpponentEffect(g, {
      trashFromHand: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { exactly: 1 } },
    });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    if (dec(g)?.kind === 'choose') none(g);
  });
});
