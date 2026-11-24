/**
 * OP11-047 Vinsmoke Reiju (Blue Character, cost 4, 5000, Counter +2000, {The Vinsmoke Family}/
 * {GERMA 66}).
 *
 * Card text: "[On Play] If your Leader has the {The Vinsmoke Family} type, look at 5 cards from the top
 * of your deck; reveal up to 1 card with a type including "GERMA" and add it to your hand. Then,
 * trash the rest."
 *
 * Rules: the Leader condition is checked first; if it is false nothing is looked at. "Type including
 * GERMA" matches by substring ({GERMA 66}, {Kingdom of GERMA}). Any card category qualifies. Up to 1
 * may be none; the rest (all five minus the one added) are trashed.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  C11,
  deck,
  describeLook,
  fill,
  hand,
  L11,
  mine,
  playCard,
  settleNoCandidates,
  settleOrders,
  trash,
} from './kit-op11b.ts';

const REIJU = 'OP11-047';
/** OP10-064 Clone Soldier: Purple Character, cost 2, {The Vinsmoke Family}/{Kingdom of GERMA}. */
const KINGDOM = 'OP10-064';
/** OP04-116 Diable Jambe Joue Shot: Yellow Event, {The Vinsmoke Family} only. */
const VINSMOKE_ONLY = 'OP04-116';
/** OP06-078 GERMA 66: Purple Event, {The Vinsmoke Family}/{GERMA 66}. */
const GERMA_EVENT = 'OP06-078';
/** OP12-041 Sanji: Leader, {Straw Hat Crew}/{The Vinsmoke Family}. */
const SANJI_LEADER = 'OP12-041';

const start = (leader: string) => (deckTop: string[]) => {
  const g = mine(leader, { hand: [REIJU], deck: deckTop });
  playCard(g, REIJU);
  return g;
};

describeLook({
  id: REIJU,
  n: 5,
  start: start(L11.vinsmoke),
  match: [C11.germa5, KINGDOM],
  miss: C11.c3,
  notOffered: [
    { card: VINSMOKE_ONLY, why: '{The Vinsmoke Family} alone does not include "GERMA"' },
  ],
  rest: 'trash',
});

describe('OP11-047 Vinsmoke Reiju: more cases', () => {
  it('the rest is trashed: with nothing added, all 5 looked-at cards are in the trash and none returns to the deck', () => {
    const g = start(L11.vinsmoke)([C11.c3, C11.c3, C11.c3, C11.c4, C11.c4, ...fill(BLUE, 9)]);
    settleNoCandidates(g, true);
    expect(trash(g)).toEqual([C11.c3, C11.c3, C11.c3, C11.c4, C11.c4].sort());
    expect(deck(g)).toHaveLength(9);
  });

  it('an Event with a GERMA type qualifies (any card)', () => {
    const g = start(L11.vinsmoke)([GERMA_EVENT, C11.c3, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 9)]);
    g.act({ type: 'pick', choice: g.zone('p1', 'deck')[0]!.instance });
    if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    settleOrders(g);
    expect(hand(g)).toEqual([GERMA_EVENT]);
    expect(trash(g)).toHaveLength(4);
  });

  it('without a {The Vinsmoke Family} Leader nothing is looked at: the deck is untouched', () => {
    const g = mine(L11.mono, {
      hand: [REIJU],
      deck: [C11.germa5, KINGDOM, ...fill(BLUE, 13)],
    });
    playCard(g, REIJU);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(C11.germa5);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('a Leader that merely has {The Vinsmoke Family} among its types (OP12-041 Sanji) satisfies the condition', () => {
    const g = start(SANJI_LEADER)([C11.germa5, C11.c3, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 9)]);
    g.act({ type: 'pick', choice: g.zone('p1', 'deck')[0]!.instance });
    if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    settleOrders(g);
    expect(hand(g)).toEqual([C11.germa5]);
    expect(trash(g)).toHaveLength(4);
  });
});
