/**
 * OP04-077 Ideo (Character, Black, cost 2, 2000, Counter +1000, {Dressrosa}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)" No other text.
 *
 * Rules: [Blocker] (CR 10-1-1): usable in the Block Step by resting an active Blocker.
 */
import { describe, expect, it } from 'vitest';
import { act, C29, describeBlocker, fill, ids29, inst, L29, need, theirs } from './kit-st29a.ts';

const ID = 'OP04-077';

describeBlocker({ id: ID, cost: 2, power: 2000, counter: 1000 });

describe('OP04-077 Ideo: more Blocker situations', () => {
  it('the block turns an attack on my Leader into an attack on Ideo: the Leader keeps all its Life', () => {
    const g = theirs(L29.croc, { characters: [ID], life: fill(C29.c1, 4) }, {});
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', ID) });
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
  });
});
