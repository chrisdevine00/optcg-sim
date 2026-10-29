/**
 * RL-45 OP17-058 Kaido: two timings, one use per turn (QA-OP17 OP17-058).
 */
import { describe, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  KAIDO,
  passBlock,
  pick,
  PLAIN_BLUE,
  takeDamage,
  V,
} from '../../cards/helpers.ts';

describe('RL-45: OP17-058 Kaido: two timings, one use per turn', () => {
  it('RL-45 (QA-OP17 OP17-058): declining on one attack keeps the use for a later attack that turn', () => {
    const g = game(
      { leader: KAIDO, costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c6, V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    const at = (c: string) =>
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', c), target: g.leader('p1') });
    at(V.c5);
    decline(g);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    at(V.c6);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    at(V.c7);
    expectDecision(g, 'block', 'p1');
  });
});
