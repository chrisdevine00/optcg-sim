/** OP13-075 Guess We'll Have Another Scrap. You Can Only Risk Death While You're Still Alive!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  endCounter,
  expectDecision,
  play,
  trash,
} from './helpers.ts';
import {
  counterStep,
  mine,
  OTHER_LEADER,
  ROGER_LEADER,
  useCounter,
  withDon,
} from './helpers-op13g3.ts';

const ID = 'OP13-075';

describe("OP13-075 Guess We'll Have Another Scrap", () => {
  const start = (leader: string, given: number) =>
    mine({ leader: given ? withDon(leader, given) : leader, hand: [ID] }, {}, 5);

  it('[Main] you may rest 1 DON!!: with a [Gol.D.Roger] Leader and DON!! given, add up to 1 DON!! from the DON!! deck and rest it', () => {
    const g = start(ROGER_LEADER, 1);
    play(g, ID);
    accept(g);
    // Event cost 1 paid, then 1 rested for the effect.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3 });
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('declining the optional cost does nothing (the Event is still played)', () => {
    const g = start(ROGER_LEADER, 1);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expectDecision(g, 'main', 'p1');
  });

  it('with no DON!! given the rest is paid but no DON!! is added', () => {
    const g = start(ROGER_LEADER, 0);
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expectDecision(g, 'main', 'p1');
  });

  it('with another Leader the rest is paid but no DON!! is added', () => {
    const g = start(OTHER_LEADER, 1);
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expectDecision(g, 'main', 'p1');
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: ROGER_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(10000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});
