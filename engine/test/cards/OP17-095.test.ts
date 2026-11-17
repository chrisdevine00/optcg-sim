/** OP17-095 Roronoa Zoro. RL-31 (replacement effects), QA-OP17 OP17-021 / OP17-023. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  times,
  V,
} from './helpers.ts';
import { expectBigCondition } from './helpers-sabo.ts';

describe('OP17-095 Roronoa Zoro', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-095', (g, id) => g.power(id), 2000, 5000);
  });

  /** P2's effect K.O.s P1's Character (the Zoro or another one). */
  const koByEffect = (target: string, trashCards: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: ['OP17-095', V.c4], trash: trashCards },
      { leader: PLAIN_BLUE },
    );
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', target),
      by: 'p2',
    }).state;
    return g;
  };

  it("saves any of your Characters from removal by the opponent's effect: place 3 cards from your trash at the bottom of your deck", () => {
    const g = koByEffect(V.c4, [BLUE, BLUE, PURPLE, V.c1]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', PURPLE),
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', BLUE, 0),
    ]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-3)
        .map((c) => c.card)
        .sort(),
    ).toEqual([BLUE, PURPLE, V.c1].sort());
  });

  it('it also saves the Zoro itself', () => {
    const g = koByEffect('OP17-095', times(3, BLUE));
    accept(g);
    // Exactly 3 cards in the trash: all are placed, nothing is left to choose.
    if (g.legal().some((a) => a.type === 'pick'))
      pick(
        g,
        g.zone('p1', 'trash').map((c) => c.instance),
      );
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain('OP17-095');
    expect(trash(g, 'p1')).toEqual([]);
  });

  it("the replacement may be declined: the Character is K.O.'d", () => {
    const g = koByEffect(V.c4, times(4, BLUE));
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
    expect(trash(g, 'p1')).toContain(V.c4);
    expect(trash(g, 'p1')).toHaveLength(5);
  });

  it('cannot be used with fewer than 3 cards in the trash', () => {
    const g = koByEffect(V.c4, [BLUE, BLUE]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
    expectDecision(g, 'main', 'p1');
  });

  it('does not apply to removal by your own effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: ['OP17-095', V.c4], trash: times(4, BLUE) },
      { leader: PLAIN_BLUE },
    );
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c4),
      by: 'p1',
    }).state;
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
  });

  it('does not apply to a battle K.O.', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: ['OP17-095', { card: V.c1, rested: true }],
        trash: times(4, BLUE),
      },
      { leader: PLAIN_BLUE, characters: [V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.find('p1', 'characters', V.c1),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP17-095']);
  });
});
