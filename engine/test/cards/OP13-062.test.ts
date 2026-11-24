/** OP13-062 Crocus. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { boost } from './helpers-op15g1.ts';
import { canPick, idsOf, mine, OTHER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-062';

describe('OP13-062 Crocus', () => {
  const onField = (opp: string[]) => mine({ characters: [ID] }, { characters: opp });

  it('[On Play] with DON!! given: add up to 1 DON!! from the DON!! deck and set it as active', () => {
    const g = mine({ leader: withDon(OTHER_LEADER), hand: [ID] });
    play(g, ID);
    const before = don(g, 'p1');
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: before.active + 1, rested: before.rested });
  });

  it('[On Play] with no DON!! given nothing happens', () => {
    const g = mine({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play] the DON!! add can be declined (count 0)', () => {
    const g = mine({ leader: withDon(OTHER_LEADER), hand: [ID] });
    play(g, ID);
    const before = don(g, 'p1');
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1')).toMatchObject({ active: before.active, rested: before.rested });
  });

  it('[When Attacking] returns up to 1 opposing Character with a base power of 3000 or less to the hand', () => {
    const g = onField([V.c1, V.c2]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'hand')).toContain(V.c1);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('[When Attacking] reads BASE power: a boosted 3000-base Character is a target, a 4000-base one is not', () => {
    const g = onField([V.c1, V.c2]);
    boost(g, g.find('p2', 'characters', V.c1), 2000);
    boost(g, g.find('p2', 'characters', V.c2), -1000);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(3000);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('[When Attacking] "up to 1": may return nothing; with no DON!! given it is still unconditional', () => {
    const g = onField([V.c1]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });
});
