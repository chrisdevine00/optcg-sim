/** OP13-072 Buggy. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, play, V } from './helpers.ts';
import { mine, OTHER_LEADER, ROGER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-072';

describe('OP13-072 Buggy', () => {
  it('[On Play] with a {Roger Pirates} Leader and any DON!! given: add up to 1 DON!! from the DON!! deck and rest it', () => {
    const g = mine({ leader: withDon(ROGER_LEADER), hand: [ID] });
    play(g, ID);
    const rested = don(g, 'p1').rested;
    addMost(g);
    expect(don(g, 'p1').rested).toBe(rested + 1);
  });

  it('a {Roger Pirates} Leader with no DON!! given: nothing', () => {
    const g = mine({ leader: ROGER_LEADER, hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('DON!! given but another Leader type: nothing', () => {
    const g = mine({ leader: withDon(OTHER_LEADER), hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('DON!! given to a Character counts', () => {
    const g = mine({ leader: ROGER_LEADER, characters: [{ card: V.c3, don: 1 }], hand: [ID] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('the add may be declined (count 0)', () => {
    const g = mine({ leader: withDon(ROGER_LEADER), hand: [ID] });
    play(g, ID);
    const rested = don(g, 'p1').rested;
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').rested).toBe(rested);
  });
});
