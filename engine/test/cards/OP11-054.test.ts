/** OP11-054 Nami. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, option, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { HANCOCK } from './helpers-hancock-rosi.ts';

describe('OP11-054 Nami', () => {
  const start = (leader: string) => {
    const g = game(
      {
        leader,
        hand: ['OP11-054', V.c1, V.c2],
        deck: [BLUE, BLUE, BLUE, V.c3],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP11-054');
    return g;
  };

  it('has [Blocker]', () => {
    const g = start(PLAIN_BLUE);
    expect(g.card(g.find('p1', 'characters', 'OP11-054')).keywords).toContain('Blocker');
  });

  it('[On Play] with a multicolored Leader: draws 3, then places 2 hand cards at the top or bottom of the deck', () => {
    const g = start(HANCOCK);
    expect(hand(g, 'p1')).toHaveLength(5);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    // One choice for both cards: top or bottom.
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE, BLUE]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(3);
    expect(deck[0]).toBe(V.c3);
    expect(deck.slice(1).sort()).toEqual([V.c1, V.c2].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('may place them on top instead', () => {
    const g = start(HANCOCK);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    option(g, 'top');
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2).sort()).toEqual([V.c1, V.c2].sort());
    expect(deck[2]).toBe(V.c3);
  });

  it('with a Leader that is not multicolored nothing is drawn or placed', () => {
    const g = start('ST03-001');
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
    expectDecision(g, 'main', 'p1');
  });
});
