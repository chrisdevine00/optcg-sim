/** OP11-080 Gear Two (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  play,
  PLAIN_BLUE,
} from './helpers.ts';
import { counterStep, IMPEL_LEADER, RED_LEADER, useCounter } from './helpers-op11g3.ts';

const ID = 'OP11-080';

describe('OP11-080 Gear Two', () => {
  const start = (leader: string, active = 5) =>
    game({ leader, hand: [ID], costArea: { active, rested: 0 } }, { leader: PLAIN_BLUE });

  it('[Main]: rest 2 DON!!; with a blue Leader add up to 1 DON!! from the DON!! deck and rest it', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    // 5 active: 1 for the Event, 2 rested for the cost; +1 rested from the deck.
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4, deck: 4 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('"up to 1": the count may be 0', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    accept(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.length).toBe(2);
    g.act({ type: 'pick', choice: { option: d.options![d.options!.length - 1]!.id } });
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('the cost is optional: declining rests nothing and adds nothing', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1, deck: 5 });
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Leader whose colors include blue counts (Blue/Purple)', () => {
    const g = start(IMPEL_LEADER);
    play(g, ID);
    accept(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 4, deck: 4 });
  });

  it('with a Leader that is not blue the cost is paid and nothing is added', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('with fewer than 2 active DON!! left the cost cannot be paid: accepting is not legal', () => {
    const g = start(PLAIN_BLUE, 2);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 3, rested: 0 } },
      {},
      'ST02-012',
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
