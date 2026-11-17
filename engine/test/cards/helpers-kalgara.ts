/** Constants and positions shared by the Kalgara (M4b wave 2) card tests. */
import type { PlayerSpec } from '@optcg/engine';
import { endCounter, expectDecision, game, passBlock, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

/** OP08-098 Kalgara (Leader, Yellow, {Sky Island}{Shandian Warrior}{Jaya}). */
export const KAL = 'OP08-098';
/** Vanilla Yellow {Sky Island}{Shandian Warrior}: Genbo, cost 3, 5000. */
export const GENBO = 'OP06-105';
/** Vanilla {Sky Island}{Shandian Warrior}: Seto, cost 5, 6000. */
export const SETO = 'OP12-103';
/** Vanilla {Sky Island}{Shandian Warrior}: Wyper, cost 6, 7000. */
export const WYPER6 = 'OP12-114';
/** Vanilla [Kalgara] {Sky Island}{Shandian Warrior}: cost 6, 8000. */
export const KALGARA_V = 'OP08-099';
/** Vanilla {Sky Island} (not Shandian Warrior): Holly, cost 3, 5000. */
export const HOLLY = 'OP05-110';
/** OP05-117 Upper Yard (Stage). */
export const UPPER_YARD = 'OP05-117';
/** OP08-109 Mont Blanc Noland (Character, {Jaya}{Botanist}, cost 5). */
export const NOLAND = 'OP08-109';
/** OP15-108 Nami: a 2000-power Character (its [On Play] only matters when played). */
export const WEAK = 'OP15-108';

/** Ids of cards in a zone, in order. */
export const ids = (cards: { card: string }[]): string[] => cards.map((c) => c.card);

/**
 * Shared [Trigger] position: p2 attacks p1's Leader (Kalgara OP08-098), whose top Life card is
 * `top`. The decider is p1 at the `trigger` decision.
 */
export function damageWith(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
) {
  const g = game(
    { leader: KAL, life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7], ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** p1 defends against V.c7 (9000) with Kalgara as Leader; stops at p1's Counter Step decision. */
export function counterStep(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}) {
  const g = game(
    { leader: KAL, ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7], ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  expectDecision(g, 'counter', 'p1');
  return g;
}
