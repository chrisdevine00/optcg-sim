/** OP13-113 Lilith: [On Play] look at 4, reveal up to 1 card with a [Trigger] other than [Lilith]; [Trigger] activate [On Play]. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { BMP, ENEL, ids, settleOrder as settle, TRIG, TRIG5 } from './helpers-robin.ts';
import { damageWith } from './triggers.ts';

const LILITH = 'OP13-113';
const DECK = [BLUE, TRIG, LILITH, BMP, TRIG5, PURPLE, PURPLE];

describe('OP13-113 Lilith', () => {
  it('[On Play] offers only cards with a [Trigger] other than Lilith among the 4; the rest go to the bottom', () => {
    const g = game(
      { leader: ENEL, hand: [LILITH], deck: DECK, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, LILITH);
    expectDecision(g, 'choose', 'p1');
    // Looked at: BLUE, TRIG, LILITH, BMP. Only TRIG qualifies (LILITH is excluded by name).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', TRIG)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([TRIG]);
    // 7 cards in the deck, 1 taken: TRIG5, PURPLE, PURPLE stay on top, the other 3 go to the bottom.
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 3)).toEqual([TRIG5, PURPLE, PURPLE]);
    expect([...deck.slice(3)].sort()).toEqual([BLUE, LILITH, BMP].sort());
  });

  it('"up to 1": nothing may be taken, all 4 go to the bottom', () => {
    const g = game(
      { leader: ENEL, hand: [LILITH], deck: DECK, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, LILITH);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck').slice(0, 3)).toEqual([TRIG5, PURPLE, PURPLE]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(7);
  });

  it('with no card to take it is still resolved (all 4 to the bottom)', () => {
    const g = game(
      {
        leader: ENEL,
        hand: [LILITH],
        deck: [BLUE, BMP, LILITH, BLUE, TRIG, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, LILITH);
    expectDecision(g, 'choose', 'p1'); // the looked-at cards are shown: nothing can be taken
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck').slice(0, 2)).toEqual([TRIG, PURPLE]);
  });

  it('[Trigger] activates the [On Play] effect', () => {
    const g = damageWith(LILITH, { leader: ENEL, deck: DECK });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', TRIG)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([TRIG]);
    expect(ids(g, 'p1', 'trash')).toEqual([LILITH]);
  });
});
