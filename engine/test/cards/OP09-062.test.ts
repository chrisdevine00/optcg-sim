/** OP09-062 Nico Robin (Leader): [Banish]; [When Attacking] trash 1 card with a [Trigger]: add 1 rested DON!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  pick,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { ids, ROBIN, TRIG } from './helpers-robin.ts';

const attack = (g: ReturnType<typeof game>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

describe('OP09-062 Nico Robin', () => {
  it('has [Banish]', () => {
    const g = game({ leader: ROBIN }, { leader: PLAIN_BLUE });
    expect(g.card(g.leader('p1')).keywords).toContain('Banish');
  });

  it('[When Attacking] trash a [Trigger] card: add 1 rested DON!! from the DON!! deck', () => {
    const g = game(
      { leader: ROBIN, hand: [TRIG, BLUE], costArea: { active: 3, rested: 2 } },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    accept(g);
    // Only the card with a [Trigger] can be paid.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    addMost(g);
    expect(ids(g, 'p1', 'trash')).toEqual([TRIG]);
    expect(ids(g, 'p1', 'hand')).toEqual([BLUE]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('the cost may be declined: nothing is trashed or added', () => {
    const g = game(
      { leader: ROBIN, hand: [TRIG], costArea: { active: 3, rested: 2 } },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    decline(g);
    expect(ids(g, 'p1', 'hand')).toEqual([TRIG]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, deck: 5 });
    expectDecision(g, 'block', 'p2');
  });

  it('with no card with a [Trigger] in hand the cost cannot be paid', () => {
    const g = game(
      { leader: ROBIN, hand: [BLUE, PURPLE], costArea: { active: 3, rested: 2 } },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(don(g, 'p1').deck).toBe(5);
    expect(ids(g, 'p1', 'hand')).toEqual([BLUE, PURPLE]);
  });

  it('RL-50: with an empty DON!! deck the cost is still paid and nothing is added', () => {
    const g = game(
      { leader: ROBIN, hand: [TRIG], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    expect(ids(g, 'p1', 'trash')).toEqual([TRIG]);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, deck: 0 });
  });

  it('[Banish]: a hit trashes the Life card without its [Trigger]', () => {
    const g = game({ leader: ROBIN }, { leader: PLAIN_BLUE, life: [TRIG, PURPLE, PURPLE] });
    attack(g);
    decline(g); // nothing in hand to pay with
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(ids(g, 'p2', 'trash')).toEqual([TRIG]);
    expect(g.life('p2')).toBe(2);
    expectDecision(g, 'main', 'p1');
  });
});
