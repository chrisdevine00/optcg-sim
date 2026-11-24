/** EB05-036 Tsuru. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, hand, play, PLAIN_BLUE } from './helpers.ts';
import { donArea } from './helpers-luffyace.ts';
import { DONQ_LEADER, NAVY_LEADER } from './helpers-eb05g2.ts';

const TSURU = 'EB05-036';
const start = (leader: string, donDeck = 6) =>
  game({ leader, hand: [TSURU], ...donArea(4, 6 - donDeck), donDeck }, { leader: PLAIN_BLUE });

describe('EB05-036 Tsuru', () => {
  it('[On Play] with a {Navy} Leader: draws 1 and adds 1 DON!! as rested', () => {
    const g = start(NAVY_LEADER);
    play(g, TSURU);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5, deck: 5 });
  });

  it('with no DON!! left in the DON!! deck, it still draws', () => {
    const g = start(NAVY_LEADER, 0);
    play(g, TSURU);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 10, deck: 0 });
  });

  it('without a {Navy} Leader nothing is drawn and no DON!! is added', () => {
    const g = start(DONQ_LEADER);
    play(g, TSURU);
    expect(hand(g, 'p1')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });
});
