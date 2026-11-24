/** OP13-069 Tom. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, hand, none, payDon, play, V } from './helpers.ts';
import { idsOf, mine, pickableCards, pickCard, STAGE1, STAGE3, STAGE6 } from './helpers-op13g3.ts';

const ID = 'OP13-069';

describe('OP13-069 Tom', () => {
  const start = (active = 3, trash = [STAGE1, STAGE3, STAGE6, V.c1]) =>
    mine({ hand: [ID], trash }, {}, active);

  it('[On Play] DON!! -1: add up to 1 Stage card with a cost of 3 or less from your trash to your hand', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    // Cost 1 and cost 3 Stages are candidates; the cost-6 Stage and the Character are not.
    expect(pickableCards(g).sort()).toEqual([STAGE1, STAGE3].sort());
    pickCard(g, STAGE3);
    expect(hand(g, 'p1')).toEqual([STAGE3]);
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([STAGE1, STAGE6, V.c1].sort());
  });

  it('boundary: a cost-6 Stage alone gives no candidate', () => {
    const g = start(3, [STAGE6]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(pickableCards(g)).toEqual([]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may add nothing after paying the DON!! -1', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('declining the DON!! -1: nothing is added and no DON!! returns', () => {
    const g = start();
    play(g, ID);
    const deck = don(g, 'p1').deck;
    decline(g);
    expect(don(g, 'p1').deck).toBe(deck);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the DON!! -1 can be paid with a rested DON!! (all the DON!! rested after the play cost)', () => {
    const g = start(2);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1, deck: 9 });
    pickCard(g, STAGE1);
    expect(hand(g, 'p1')).toEqual([STAGE1]);
  });
});
