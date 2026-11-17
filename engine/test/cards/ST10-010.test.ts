/** ST10-010 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  play,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('ST10-010 Trafalgar Law', () => {
  const start = (oppHand: number) =>
    game(
      { leader: PLAIN_PURPLE, hand: ['ST10-010'], costArea: { active: 5, rested: 0 } },
      {
        leader: PLAIN_BLUE,
        hand: [PURPLE, V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7].slice(0, oppHand),
      },
    );

  it('[Blocker] is a printed keyword', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: ['ST10-010'] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'ST10-010')).keywords).toContain('Blocker');
  });

  it("[On Play] DON!! -1: with 7 or more cards in the opponent's hand, 2 are trashed face-down by the activating player (M4b-02, QA-ST10)", () => {
    const g = start(7);
    play(g, 'ST10-010');
    accept(g);
    payDon(g);
    // No decision for either player: the activating player chooses face-down (the engine picks at
    // random), so the opponent is not asked and p1 is not shown the hand.
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(g.zone('p2', 'trash')).toHaveLength(2);
    expect(don(g, 'p1').deck).toBe(6);
  });

  it("with 6 cards in the opponent's hand nothing is trashed (the DON!! is still returned)", () => {
    const g = start(6);
    play(g, 'ST10-010');
    accept(g);
    payDon(g);
    expect(hand(g, 'p2')).toHaveLength(6);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1').deck).toBe(6);
  });

  it('may be declined: nothing is returned or trashed', () => {
    const g = start(7);
    play(g, 'ST10-010');
    decline(g);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(don(g, 'p1').deck).toBe(5);
    expect(hand(g, 'p1')).not.toContain(BLUE);
  });
});
