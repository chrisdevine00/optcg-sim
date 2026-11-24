/** EB05-028 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  times,
  trash,
  V,
} from './helpers.ts';
import { donArea } from './helpers-luffyace.ts';

const HANCOCK = 'EB05-028';
const start = (oppHand: number) =>
  game(
    { leader: PLAIN_BLUE, hand: [HANCOCK], ...donArea(4) },
    { leader: PLAIN_BLUE, hand: [...times(oppHand - 1, PURPLE), V.c7] },
  );

describe('EB05-028 Boa Hancock', () => {
  it("[On Play] with 9 cards in the opponent's hand, the opponent chooses and trashes 4", () => {
    const g = start(9);
    play(g, HANCOCK);
    expectDecision(g, 'choose', 'p2'); // the opponent picks
    const ids = g
      .zone('p2', 'hand')
      .slice(0, 4)
      .map((c) => c.instance);
    pick(g, ids);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toHaveLength(4);
    expectDecision(g, 'main', 'p1');
  });

  it('the opponent may keep the card they like: they choose which 4', () => {
    const g = start(10);
    play(g, HANCOCK);
    const keep = g.find('p2', 'hand', V.c7);
    pick(
      g,
      g
        .zone('p2', 'hand')
        .filter((c) => c.instance !== keep)
        .slice(0, 4)
        .map((c) => c.instance),
    );
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(hand(g, 'p2')).toContain(V.c7);
  });

  it("with 8 cards in the opponent's hand nothing is trashed", () => {
    const g = start(8);
    play(g, HANCOCK);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toHaveLength(8);
    expect(trash(g, 'p2')).toHaveLength(0);
  });
});
