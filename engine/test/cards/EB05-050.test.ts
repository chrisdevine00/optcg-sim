/** EB05-050 Atlas: [On Play] Look at 4 cards from the top of your deck; reveal up to 1 card with the "Wisdom" attribute and add it to your hand. Then, place the rest at the bottom of your deck in any order. [Trigger] Activate this card's [On Play] effect. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import { settleOrder, triggerHit } from './helpers-robin.ts';

const ATLAS = 'EB05-050';
/** EB05-003 Pasia: a vanilla Wisdom Character; the V.cN cards used as filler are Slash or Strike. */
const WISDOM = 'EB05-003';

describe('EB05-050 Atlas', () => {
  const setup = (deck: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ATLAS], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );

  it('[On Play] look at 4, add up to 1 Wisdom card to hand, the rest go to the bottom', () => {
    const g = setup([V.c1, WISDOM, V.c2, V.c3, V.c4, V.c5]);
    play(g, ATLAS);
    // Only the Wisdom card is a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', WISDOM)]);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([WISDOM]);
    // 6 cards in the deck, 1 taken: the 3 others looked at are now under V.c4, V.c5.
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(5);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('[On Play] "up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = setup([WISDOM, V.c1, V.c2, V.c3, V.c4]);
    play(g, ATLAS);
    none(g);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c4);
  });

  it('[On Play] with no Wisdom card among the 4 nothing can be added', () => {
    const g = setup([V.c1, V.c2, V.c3, V.c4, V.c5]);
    play(g, ATLAS);
    none(g);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[On Play] a Wisdom card in 5th place is not looked at', () => {
    const g = setup([V.c1, V.c2, V.c3, V.c4, WISDOM]);
    play(g, ATLAS);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("[Trigger] activates this card's [On Play] effect (the card is not played)", () => {
    const g = triggerHit(ATLAS, { deck: [V.c1, WISDOM, V.c2, V.c3, V.c4] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', WISDOM)]);
    settleOrder(g);
    expect(hand(g, 'p1')).toEqual([WISDOM]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expectDecision(g, 'main', 'p2');
  });
});
