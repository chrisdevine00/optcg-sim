/** OP14-102 Kumacy. */
import { describe, expect, it } from 'vitest';
import { expectDecision, play, V } from './helpers.ts';
import { describeTbpTrigger, OTHER_LEADER, start } from './helpers-op14g4.ts';

const ID = 'OP14-102';

describe('OP14-102 Kumacy', () => {
  it('has no [On Play] effect: playing it from the hand asks nothing', () => {
    const g = start({
      leader: OTHER_LEADER,
      hand: [ID],
      trash: [V.c1],
      costArea: { active: 1, rested: 0 },
    });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});

describeTbpTrigger(ID);
