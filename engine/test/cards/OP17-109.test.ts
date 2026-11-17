/** OP17-109 Charlotte Pudding: [On Play] trash 1 [Trigger] card: draw 3; [Trigger] look at 5, take a {Big Mom Pirates} card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { BMP, BMP6, ENEL, ids, settleOrder, TRIG } from './helpers-robin.ts';
import { damageWith } from './triggers.ts';

const PUDDING = 'OP17-109';

describe('OP17-109 Charlotte Pudding', () => {
  it('[On Play] trash a card with a [Trigger]: draw 3', () => {
    const g = game(
      {
        leader: ENEL,
        hand: [PUDDING, TRIG, BLUE],
        deck: [PURPLE, PURPLE, BMP, BLUE],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, PUDDING);
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    expect(ids(g, 'p1', 'trash')).toEqual([TRIG]);
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE, PURPLE, BMP]);
  });

  it('[On Play] the cost may be declined: nothing happens', () => {
    const g = game(
      { leader: ENEL, hand: [PUDDING, TRIG], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, PUDDING);
    decline(g);
    expect(hand(g, 'p1')).toEqual([TRIG]);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play] a hand without a [Trigger] card cannot pay', () => {
    const g = game(
      { leader: ENEL, hand: [PUDDING, BLUE], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, PUDDING);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('[Trigger] looks at 5, takes a {Big Mom Pirates} card and sends the other 4 to the bottom', () => {
    const g = damageWith(PUDDING, {
      leader: ENEL,
      deck: [BLUE, BMP, PURPLE, BMP6, BLUE, PURPLE],
    });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', BMP6)]);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([BMP6]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck[0]).toBe(PURPLE); // the 6th card is untouched, now on top
    expect(deck).toHaveLength(5);
  });
});
