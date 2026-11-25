/** OP09-111 Brook. */
import { describe, expect, it } from 'vitest';
import {
  EGG_LEADER,
  expectDecision,
  handIds,
  hitWith,
  idsOf,
  OTHER_LEADER,
  pending,
  pick,
  times,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-111';
const OPP_HAND = [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7];

describe('OP09-111 Brook [Trigger]', () => {
  it('with an {Egghead} Leader and 6 cards in their hand (boundary), the opponent trashes 2', () => {
    const g = hitWith(ID, EGG_LEADER, {}, { hand: OPP_HAND.slice(0, 6) });
    g.act({ type: 'trigger', activate: true });
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.max).toBe(2);
    pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c4)]);
    expect(handIds(g, 'p2')).toHaveLength(4);
    expect(idsOf(g, 'p2', 'trash')).toEqual(expect.arrayContaining([V.c1, V.c4]));
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('works with more than 6 cards', () => {
    const g = hitWith(ID, EGG_LEADER, {}, { hand: OPP_HAND });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'hand', V.c7), g.find('p2', 'hand', V.c6)]);
    expect(handIds(g, 'p2')).toHaveLength(5);
  });

  it('must not fire with 5 cards in their hand', () => {
    const g = hitWith(ID, EGG_LEADER, {}, { hand: OPP_HAND.slice(0, 5) });
    g.act({ type: 'trigger', activate: true });
    // Boundary: with 5 the "6 or more" condition fails, so no trash prompt is asked at all.
    expect(pending(g, 'choose')).toBe(false);
    expect(handIds(g, 'p2')).toHaveLength(5);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('must not fire without an {Egghead} Leader', () => {
    const g = hitWith(ID, OTHER_LEADER, {}, { hand: OPP_HAND });
    g.act({ type: 'trigger', activate: true });
    expect(handIds(g, 'p2')).toHaveLength(7);
  });

  it('must not make you trash cards from your own hand', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: times(6, V.c2) }, { hand: OPP_HAND });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c2)]);
    expect(handIds(g, 'p1')).toHaveLength(6);
  });
});
