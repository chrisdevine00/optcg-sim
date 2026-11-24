/** OP13-063 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, play, V } from './helpers.ts';
import { canBlockWith, mine, OTHER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-063';

describe('OP13-063 Kouzuki Oden', () => {
  it('[On Play] with DON!! given: add up to 1 DON!! from the DON!! deck and rest it', () => {
    const g = mine({ leader: withDon(OTHER_LEADER), hand: [ID] });
    play(g, ID);
    const before = don(g, 'p1');
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: before.active, rested: before.rested + 1 });
  });

  it('[On Play] with no DON!! given nothing happens', () => {
    const g = mine({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('DON!! given to a Character also counts', () => {
    const g = mine({ characters: [{ card: V.c3, don: 2 }], hand: [ID] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('the add is optional: count 0 leaves the DON!! deck alone', () => {
    const g = mine({ leader: withDon(OTHER_LEADER), hand: [ID] });
    play(g, ID);
    const before = don(g, 'p1');
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1')).toMatchObject({ active: before.active, rested: before.rested });
  });

  it('[Blocker]: an active Oden can block an attack on the Leader', () => {
    const g = mine({ characters: [ID] }, { characters: [V.c3] });
    g.act({ type: 'endTurn' });
    // p2's turn: p2's Character attacks p1's Leader and Oden is a legal blocker.
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
