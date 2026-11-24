/** EB04-028 Ice Time: [Main] trash 1: with a {Navy} Leader, up to 2 Characters with 10000 power or less cannot attack; [Trigger] return a cost 5 or less Character. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import {
  boost,
  BIG12,
  canAttack,
  canPick,
  COST8,
  EVENT,
  ids,
  mine,
  NAVY_LEADER,
  OTHER_LEADER,
  triggerHit,
} from './helpers-eb04g2.ts';

const ID = 'EB04-028';
type G = ReturnType<typeof mine>;
const can = (g: G, card: string, nth = 0) =>
  canAttack(g, g.find('p2', 'characters', card, nth), g.leader('p1'));

const setup = (leader: string, theirs: string[], hand = [ID, EVENT]) =>
  mine({ leader, hand }, { characters: theirs });
const run = (g: G) => {
  play(g, ID);
  accept(g);
  pick(g, [g.find('p1', 'hand', EVENT)]);
};

describe('EB04-028 Ice Time', () => {
  it('[Main] with a {Navy} Leader: two Characters with 10000 power or less cannot attack until the end of their next End Phase', () => {
    const g = setup(NAVY_LEADER, [V.c7, COST8, V.c4]);
    run(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c7), g.find('p2', 'characters', COST8)]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([EVENT, ID].sort());
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(false);
    expect(can(g, COST8)).toBe(false);
    expect(can(g, V.c4)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(true);
    expect(can(g, COST8)).toBe(true);
  });

  it('exact boundary: 10000 power is a target, 10001 and 12000 are not (current power)', () => {
    const g = setup(NAVY_LEADER, [V.c7, V.c7, BIG12]);
    boost(g, g.find('p2', 'characters', V.c7, 0), 1000); // 10000
    boost(g, g.find('p2', 'characters', V.c7, 1), 1001); // 10001
    run(g);
    expect(canPick(g, g.find('p2', 'characters', V.c7, 0))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7, 1))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', BIG12))).toBe(false);
    none(g);
  });

  it('"up to 2": at most two can be picked and picking none is allowed', () => {
    const g = setup(NAVY_LEADER, [V.c7, V.c6, V.c5]);
    run(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(2);
    none(g);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(true);
  });

  it('without a {Navy} Leader the cost is still paid but nothing is restricted and no target is asked', () => {
    const g = setup(OTHER_LEADER, [V.c7]);
    run(g);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash').sort()).toEqual([EVENT, ID].sort());
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(true);
  });

  it('the "you may" cost can be declined: the Event is spent, nothing is trashed or restricted', () => {
    const g = setup(NAVY_LEADER, [V.c7]);
    play(g, ID);
    decline(g);
    expect(ids(g, 'p1', 'hand')).toEqual([EVENT]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(true);
  });

  it('[Trigger] returns up to 1 Character with a cost of 5 or less to its owner hand (cost 6 is not a target)', () => {
    const g = triggerHit(ID, {}, [V.c5, V.c6]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'characters')).toContain(V.c6);
  });

  it('[Trigger] may return one of your own Characters to your own hand', () => {
    const g = triggerHit(ID, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(ids(g, 'p1', 'hand')).toContain(V.c3);
  });
});
