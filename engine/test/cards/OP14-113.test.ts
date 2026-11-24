/** OP14-113 Marguerite. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, PURPLE, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import {
  BW5,
  ids,
  KUJA6,
  KUJA_LEADER,
  LILY4,
  OTHER_LEADER,
  settle,
  start,
} from './helpers-op14g4.ts';

const ID = 'OP14-113';
// Top 5: BLUE, LILY4, KUJA6, BW5, PURPLE. The 6th card (V.c2) is not looked at.
const DECK = [BLUE, LILY4, KUJA6, BW5, PURPLE, V.c2, V.c3];
const run = (handCards: string[], deck = DECK) => {
  const g = start({
    leader: KUJA_LEADER,
    hand: [ID, ...handCards],
    deck,
    costArea: { active: 3, rested: 0 },
  });
  play(g, ID);
  return g;
};

describe('OP14-113 Marguerite', () => {
  it('[On Play] takes 1 {Amazon Lily} or {Kuja Pirates} card of the top 5, bottoms the rest in order, then trashes 1 card from the hand', () => {
    const g = run([V.c1]);
    expectDecision(g, 'choose', 'p1');
    // Offered: LILY4 and KUJA6 only.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', LILY4)]);
    settle(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([LILY4]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 2)).toEqual([V.c2, V.c3]);
    expect(deck.slice(2).sort()).toEqual([BLUE, KUJA6, BW5, PURPLE].sort());
  });

  it('the trashed card may be the one just taken', () => {
    const g = run([V.c1]);
    pick(g, [g.find('p1', 'deck', KUJA6)]);
    settle(g);
    pick(g, [g.find('p1', 'hand', KUJA6)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([KUJA6]);
  });

  it('"up to 1": taking nothing still bottoms all 5 and trashes 1 card from the hand', () => {
    const g = run([V.c1]);
    none(g);
    settle(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(ids(g, 'p1', 'deck')[0]).toBe(V.c2);
    expect(ids(g, 'p1', 'deck')).toHaveLength(7);
  });

  it('only the top 5 are looked at: a 6th-card Amazon Lily is not offered', () => {
    const g = run([], [BLUE, BW5, PURPLE, V.c1, V.c2, LILY4]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    settle(g);
    // Nothing in the hand to trash: the turn goes on.
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageWith(ID, { leader: KUJA_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[Trigger] with another Leader does not play it', () => {
    const g = damageWith(ID, { leader: OTHER_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
