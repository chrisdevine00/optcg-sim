/** OP05-117 Upper Yard: look at 5, add up to 1 {Sky Island} card, the rest to the bottom. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { GENBO, HOLLY, ids, KAL, UPPER_YARD } from './helpers-kalgara.ts';

const position = () =>
  game(
    {
      leader: KAL,
      hand: [UPPER_YARD],
      deck: [BLUE, HOLLY, V.c1, GENBO, V.c2, V.c3],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP05-117 Upper Yard', () => {
  it('[On Play] offers only the {Sky Island} cards among the top 5 and adds the chosen one', () => {
    const g = position();
    play(g, UPPER_YARD);
    expectDecision(g, 'choose', 'p1');
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2); // Holly and Genbo; the 6th card is not looked at
    pick(g, [g.find('p1', 'deck', HOLLY)]);
    // Bottom order of the other 4: take any order if asked.
    while (g.legal().some((a) => a.type === 'order' || a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'order' || a.type === 'pick')!);
    expect(hand(g, 'p1')).toEqual([HOLLY]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([UPPER_YARD]);
    const deck = ids(g.zone('p1', 'deck'));
    expect(deck).toHaveLength(5);
    expect(deck[0]).toBe(V.c3); // the unseen 6th card is now on top
    expect(deck.slice(1).sort()).toEqual([BLUE, V.c1, GENBO, V.c2].sort());
  });

  it('"up to 1": adding nothing puts all 5 on the bottom', () => {
    const g = position();
    play(g, UPPER_YARD);
    none(g);
    while (g.legal().some((a) => a.type === 'order' || a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'order' || a.type === 'pick')!);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c3);
  });
});
