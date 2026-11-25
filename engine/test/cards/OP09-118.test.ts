/** OP09-118 Gol.D.Roger (Character, cost 10, Rush). */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  BLOCKER,
  canAttack,
  endCounter,
  expectDecision,
  game,
  idsOf,
  OTHER_LEADER,
  PLAIN_BLUE,
  rep,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-118';
const winner = (g: ReturnType<typeof game>) => queries.result(g.state);

describe('OP09-118 Gol.D.Roger', () => {
  /** p1's turn: Roger attacks p2's Leader and p2 has a [Blocker]. */
  const attack = (mine: number, theirs: number) => {
    const g = game(
      { leader: OTHER_LEADER, characters: [ID], life: rep(mine, V.c1) },
      { leader: PLAIN_BLUE, characters: [BLOCKER], life: rep(theirs, V.c1) },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2');
    return g;
  };
  const block = (g: ReturnType<typeof game>) =>
    g.act({ type: 'block', blocker: g.find('p2', 'characters', BLOCKER) });

  it('has [Rush]: it can attack the turn it is played', () => {
    const g = game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('when the opponent activates [Blocker] while the opponent has 0 Life cards, you win the game', () => {
    const g = attack(3, 0);
    block(g);
    expect(winner(g)).toMatchObject({ winner: 'p1' });
  });

  it('when the opponent activates [Blocker] while you have 0 Life cards, you win the game', () => {
    const g = attack(0, 3);
    block(g);
    expect(winner(g)).toMatchObject({ winner: 'p1' });
  });

  it('with 1 Life card each (the boundary), the block stands and nobody wins', () => {
    const g = attack(1, 1);
    block(g);
    expect(winner(g)).toBeNull();
    endCounter(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([BLOCKER]); // 2000 power blocker K.O.'d by 13000
    expect(g.life('p2')).toBe(1);
  });

  it('declining to block with 0 Life cards is a hit and the damage wins anyway (no [Blocker] activated)', () => {
    const g = attack(3, 0);
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    expect(winner(g)).toMatchObject({ winner: 'p1' });
  });

  it('must not fire when you activate [Blocker] yourself', () => {
    // p2's turn: p2 attacks p1's Leader; p1 (0 Life cards, with Roger on the field) blocks.
    const g = game(
      { leader: OTHER_LEADER, characters: [ID, BLOCKER], life: [] },
      { leader: PLAIN_BLUE, characters: [V.c7], life: rep(3, V.c1) },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    g.act({ type: 'block', blocker: g.find('p1', 'characters', BLOCKER) });
    expect(winner(g)).toBeNull();
  });
});
