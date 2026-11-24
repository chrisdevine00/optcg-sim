/** EB05-033 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  addMost,
  don,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  play,
  trash,
} from './helpers.ts';
import { DONQ_LEADER, SHC_LEADER } from './helpers-eb05g2.ts';

const ROBIN = 'EB05-033';
const start = (leader: string, oppDon: number) =>
  game(
    { leader, hand: [ROBIN], costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE, costArea: { active: oppDon, rested: 0 } },
  );

describe('EB05-033 Nico Robin', () => {
  it('[On Play] with a {Straw Hat Crew} Leader and 6 fewer DON!! than the opponent: draw 3, trash 2, add 4 rested DON!!', () => {
    const g = start(SHC_LEADER, 7);
    play(g, ROBIN);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(
      g,
      g
        .zone('p1', 'hand')
        .slice(0, 2)
        .map((c) => c.instance),
    );
    addMost(g);
    expect(trash(g, 'p1')).toHaveLength(2);
    expect(hand(g, 'p1')).toHaveLength(1);
    // 1 rested for Robin, then 4 more added rested
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });

  it('with only 5 fewer DON!! than the opponent the condition fails: nothing happens', () => {
    const g = start(SHC_LEADER, 6);
    play(g, ROBIN);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('without a {Straw Hat Crew} Leader nothing happens even with the DON!! gap', () => {
    const g = start(DONQ_LEADER, 8);
    play(g, ROBIN);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ rested: 1 });
  });
});
