/** OP15-012 Buggy. */
import { describe, expect, it } from 'vitest';
import {
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick } from './helpers-w3s.ts';

const ID = 'OP15-012';

describe('OP15-012 Buggy', () => {
  const start = (rested: number, active = 0) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active, rested } },
    );
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it('[When Attacking]: give up to 1 of the opponent’s rested DON!! to their Leader or a Character', () => {
    const g = start(2, 1);
    attack(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', PURPLE))).toBe(true);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 1 });
    expectDecision(g, 'block', 'p2');
  });

  it('"up to 1": nothing needs to be given', () => {
    const g = start(2);
    attack(g);
    none(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 0 });
    expectDecision(g, 'block', 'p2');
  });

  it('with no rested DON!! of the opponent’s nothing is asked', () => {
    const g = start(0, 2);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(don(g, 'p2')).toMatchObject({ active: 2, given: 0 });
  });

  it('[On K.O.] draws 1 card', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }], deck: [V.c1, V.c2] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('[On K.O.] does not draw when it is not K.O.’d (it only attacked)', () => {
    const g = start(0);
    attack(g);
    passBlock(g);
    endCounter(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});
