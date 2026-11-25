/** EB02-026 Nefeltari Vivi. */
import { describe, expect, it } from 'vitest';
import { C1, expectDecision, hand, mk, MULTI_LEADER } from './helpers-aeb2g1.ts';
import { play } from './helpers.ts';

const ID = 'EB02-026';
const start = (leader: string, others: number) =>
  mk({
    leader,
    hand: [ID, ...Array.from({ length: others }, () => C1)],
    costArea: { active: 3, rested: 0 },
  });

describe('EB02-026 Nefeltari Vivi', () => {
  it('multicolored Leader and 5 cards left in hand (boundary): draws 2', () => {
    const g = start(MULTI_LEADER, 5);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(7);
    expectDecision(g, 'main', 'p1');
  });

  it('6 cards left in hand: no draw', () => {
    const g = start(MULTI_LEADER, 6);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(6);
  });

  it('the hand is counted without Vivi herself (she has left the hand)', () => {
    const g = start(MULTI_LEADER, 5); // 6 in hand before playing, 5 after
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(7);
    const h = start(MULTI_LEADER, 0);
    play(h, ID);
    expect(hand(h, 'p1')).toHaveLength(2);
  });

  it('a single-colored Leader: no draw', () => {
    const g = start('ST01-001', 2);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('another multicolored Leader (a two-color Leader of other colors) qualifies too', () => {
    const g = start('EB02-010', 1);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
  });
});
