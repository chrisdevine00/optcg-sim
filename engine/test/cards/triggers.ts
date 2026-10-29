/** Shared position for [Trigger] tests: p2 attacks p1's Leader, whose top Life card is `top`. */
import {
  game,
  KAIDO,
  PLAIN_BLUE,
  PURPLE,
  V,
  passBlock,
  endCounter,
  expectDecision,
} from './helpers.ts';
import type { PlayerSpec } from '@optcg/engine';

export function damageWith(top: string, p1: Partial<PlayerSpec> = {}) {
  const g = game(
    { leader: KAIDO, life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}
