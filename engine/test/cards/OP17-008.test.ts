/** OP17-008 Jozu. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, play, PLAIN_BLUE } from './helpers.ts';
import { NEWGATE_LEADER, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-008';

describe('OP17-008 Jozu', () => {
  const start = (leader: Parameters<typeof game>[0]['leader']) =>
    game({ leader, hand: [ID], costArea: { active: 6, rested: 0 } }, { leader: PLAIN_BLUE });

  it("[On Play] your [Edward.Newgate] Leader's base power becomes 8000 until the end of the opponent's next End Phase", () => {
    const g = start(NEWGATE_LEADER);
    expect(g.power(g.leader('p1'))).toBe(6000);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('works for the other [Edward.Newgate] Leader (OP17-001, 5000)', () => {
    const g = start('OP17-001');
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('DON!! given to the Leader still add to the new base power', () => {
    const g = start({ card: NEWGATE_LEADER, don: 2 });
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(10000);
  });

  it('a Leader that is not [Edward.Newgate] is unchanged', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the opponent Leader is never affected', () => {
    const g = start(NEWGATE_LEADER);
    play(g, ID);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
