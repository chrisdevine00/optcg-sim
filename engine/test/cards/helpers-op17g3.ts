/** Constants and helpers for the OP-17 group 3 card tests (OP17-067 to OP17-117). */
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

/** ST04-001 Kaido: Purple Leader, {Animal Kingdom Pirates}; its only text is an [Activate: Main]. */
export const AKP_LEADER = 'ST04-001';
/** ST07-001 Charlotte Linlin: Yellow Leader named [Charlotte Linlin], {Big Mom Pirates}. */
export const LINLIN = 'ST07-001';
/** OP17-079 Monkey.D.Luffy: Black Leader with the {Elbaph} type (it only grants [Blocker] to cost 12+). */
export const ELBAPH_LEADER = 'OP17-079';
/** P-041 Monkey.D.Luffy: vanilla Purple Character, cost 10, 12000. */
export const COST10 = 'P-041';
/** OP17-107 Charlotte Daifuku: a Character with a printed [Trigger]. */
export const WITH_TRIGGER = 'OP17-107';
/** OP03-103 Bobbin: a vanilla Big Mom Pirates Character (no [Trigger]). */
export const NO_TRIGGER = 'OP03-103';

/** p2 attacks p1's Leader with a 7000 Character (V.c7); p1's [On Your Opponent's Attack] is next. */
export function oppAttack(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, characters: [V.c7], ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
}

/** Run an open battle to its end with no block and no counter. */
export function finishBattle(g: TestGame): void {
  passBlock(g);
  endCounter(g);
}

export { expectDecision };
