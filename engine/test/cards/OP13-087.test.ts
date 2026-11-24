/** OP13-087 Saint Charlos. */
import { describe, expect, it } from 'vitest';
import { expectDecision, play, trash, V } from './helpers.ts';
import { canBlockWith, idsOf, mine } from './helpers-op13g3.ts';

const ID = 'OP13-087';

describe('OP13-087 Saint Charlos', () => {
  it('[On Play] trash 1 card from the top of your deck', () => {
    const g = mine({ hand: [ID], deck: [V.c1, V.c2, V.c3] }, {}, 2);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c2, V.c3]);
  });

  it("exactly 1 card, and it is the top one (not the opponent's deck)", () => {
    const g = mine({ hand: [ID], deck: [V.c1, V.c2] }, { deck: [V.c5, V.c6] }, 2);
    play(g, ID);
    expect(trash(g, 'p1')).toHaveLength(1);
    expect(trash(g, 'p2')).toEqual([]);
    expect(idsOf(g, 'p2', 'deck')).toEqual([V.c5, V.c6]);
  });

  it('it is mandatory: no prompt, no decline', () => {
    const g = mine({ hand: [ID], deck: [V.c1, V.c2] }, {}, 2);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(trash(g, 'p1')).toHaveLength(1);
  });

  it('a one-card deck is milled empty (the loss comes at the next draw, RL-26)', () => {
    const g = mine({ hand: [ID], deck: [V.c1] }, {}, 2);
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([]);
  });

  it('[Blocker]: an active Charlos can block an attack on the Leader', () => {
    const g = mine({ characters: [ID] }, { characters: [V.c3] });
    g.act({ type: 'endTurn' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
