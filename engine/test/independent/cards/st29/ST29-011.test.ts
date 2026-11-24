/**
 * ST29-011 Brook (Character, Yellow, cost 2, 2000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)" No other text.
 *
 * Rules: [Blocker] (CR 10-1-1): usable in the Block Step by resting an active Blocker.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  describeBlocker,
  fill,
  ids29,
  inst,
  kind,
  L29,
  mine,
  need,
  theirs,
} from './kit-st29a.ts';

const ID = 'ST29-011';

describeBlocker({ id: ID, cost: 2, power: 2000, counter: 1000 });

describe('ST29-011 Brook: more Blocker situations', () => {
  it('two Blockers on my side: either may be chosen, only one can block', () => {
    const g = theirs(L29.croc, { characters: [ID, C29.blockerFranky], life: fill(C29.c1, 4) }, {});
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    const blockers = g
      .legal()
      .flatMap((a) => (a.type === 'block' && a.blocker !== null ? [a.blocker] : []));
    expect(blockers.sort()).toEqual(
      [inst(g, 'p1', 'characters', ID), inst(g, 'p1', 'characters', C29.blockerFranky)].sort(),
    );
    act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', ID) });
    expect(g.card(inst(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(inst(g, 'p1', 'characters', C29.blockerFranky)).rested).toBe(false);
  });

  it("it cannot block on my own turn (no attack against me): the opponent's Leader attack does not exist", () => {
    const g = mine(L29.croc, { characters: [ID] }, {});
    expect(kind(g)).toBe('main');
    expect(g.legal().some((a) => a.type === 'block')).toBe(false);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
  });
});
