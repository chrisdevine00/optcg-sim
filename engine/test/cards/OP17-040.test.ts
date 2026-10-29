/** OP17-040 Edward.Newgate. RL-18; QA-OP17 OP17-040. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  play,
  PLAIN_PURPLE,
  ROCKS,
  takeDamage,
  V,
} from './helpers.ts';

describe('OP17-040 Edward.Newgate', () => {
  it('[On Play] draws 1 card', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-040'], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP17-040');
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('when your Rocks Leader attacks: trash 1, Leader +3000 for the battle, once per turn', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-040'], hand: [BLUE, BLUE], deck: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    // The Leader's own [When Attacking] and Newgate's effect activated together: p1 orders them.
    expectDecision(g, 'order', 'p1');
    const newgateFirst = g
      .legal()
      .find((a) => a.type === 'order' && a.first.endsWith('#leader-battle'))!;
    g.act(newgateFirst);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    decline(g); // the Leader's reveal
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('QA-OP17 OP17-040: "when attacked" asks before the Block Step', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-040'], hand: [BLUE] },
      { leader: PLAIN_PURPLE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expectDecision(g, 'block', 'p1');
  });

  it('does not trigger for a non-Rocks Leader', () => {
    const g = game(
      { leader: 'ST03-001', characters: ['OP17-040'], hand: [BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2');
  });
});
