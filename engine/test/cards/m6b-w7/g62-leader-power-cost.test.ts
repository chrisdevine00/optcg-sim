/**
 * M6b wave 7, G62: the cost "give your active Leader -5000 power during this turn" (EB03-006
 * Nami, EB04-023 Chaka & Pell). The cost is a power modifier on the card a cost selector names:
 * the Leader, which must match (be active). Planted on vanilla cards; each test fails with the gap
 * reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE } from '../helpers.ts';
import { errorsOf, main, offered, run } from '../m6b-w1/probe.ts';

const leaderCost = (over: object = {}, tgt: object = {}) => ({
  power: {
    target: {
      from: 'leader',
      owner: 'you',
      filter: { state: 'active' },
      pick: { exactly: 1 },
      ...tgt,
    },
    amount: -5000,
    duration: 'thisTurn',
    ...over,
  },
});
const draw = { do: { draw: 1 } };

const mk = (leader: unknown = PLAIN_PURPLE) => {
  const g = game({ leader: leader as never, characters: [BLUE] }, { leader: PLAIN_BLUE });
  g.state = withAbilities(g.state, BLUE, [main([draw] as never, [leaderCost()] as never)]);
  return g;
};

describe('G62 a power cost on your Leader', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (cost: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', cost: [cost], effect: [draw] });
    expect(bad(leaderCost())).toEqual([]);
    expect(bad(leaderCost({ amount: 2000 }))).toEqual([]);
    // Your Leader only, exactly one card, a real change, and a duration.
    expect(bad(leaderCost({}, { from: 'characters' }))).not.toEqual([]);
    expect(bad(leaderCost({}, { owner: 'opponent' }))).not.toEqual([]);
    expect(bad(leaderCost({}, { pick: { upTo: 1 } }))).not.toEqual([]);
    expect(bad(leaderCost({ amount: 0 }))).not.toEqual([]);
    expect(bad(leaderCost({ amount: 500.5 }))).not.toEqual([]);
    expect(bad(leaderCost({ duration: 'forever' }))).not.toEqual([]);
  });

  it('pays by lowering the Leader’s power for the turn, then the effect resolves', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(offered(g)).toBe(true);
    run(g);
    expect(g.power(g.leader('p1'))).toBe(0);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('a rested Leader is not an active Leader: the cost cannot be paid', () => {
    const g = mk({ card: PLAIN_PURPLE, rested: true });
    expect(offered(g)).toBe(false);
  });

  it('the cost can be paid again: nothing stops a Leader at 0 power', () => {
    const g = mk();
    const before = hand(g, 'p1').length;
    run(g);
    run(g);
    expect(hand(g, 'p1')).toHaveLength(before + 2);
  });

  it('ends with the turn', () => {
    const g = mk();
    run(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
