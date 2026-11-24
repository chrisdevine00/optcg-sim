/**
 * Helpers and constants for the OP-15 group 3 card tests (OP15-084 to OP15-117). Every constant
 * below is a vanilla (or a card whose text is inert where the test puts it), so a test never
 * depends on another script.
 */
import type { PlayerSpec } from '@optcg/engine';
import { cards, type TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE } from './helpers.ts';
import { names } from './helpers-op16g4.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';

export { counterStep, useCounter } from './helpers-luffyace.ts';
export { koByBattle, names, trig } from './helpers-op16g4.ts';
export { plantOpponentEffect };
export { canAccept, canActivate, canAttack, offers } from './helpers-op16g1.ts';

/** ST01-001 Luffy Leader (Red, {Straw Hat Crew}); its only text is an [Activate: Main]. */
export const SHC_LEADER = 'ST01-001';
/** OP06-080 Gecko Moria Leader (Black, {Thriller Bark Pirates}); [DON!! x1] [When Attacking] only. */
export const TBP_LEADER = 'OP06-080';
/** OP08-098 Kalgara Leader (Yellow, {Sky Island}{Shandian Warrior}{Jaya}); [DON!! x1] [When Attacking] only. */
export const SI_LEADER = 'OP08-098';
/** ST03-001 Crocodile Leader (Blue): none of the types above. */
export const OTHER_LEADER = PLAIN_BLUE;

/** {Straw Hat Crew} vanillas by cost/power. */
export const SHC_C1 = 'OP04-007'; // Sanji, Red, cost 1, 3000
export const SHC_C4 = 'OP09-063'; // Usopp, Purple, cost 4, 6000
export const SHC_C5_7000 = 'OP10-013'; // Nami, Red, cost 5, 7000
export const SHC_C6 = 'OP10-089'; // Nico Robin, Black, cost 6, 8000
export const SHC_C7 = 'OP09-067'; // Jinbe, Purple, cost 7, 9000, also {Fish-Man}
export const SHC_C8 = 'OP16-086'; // Sanji, Black, cost 8, 9000
export const SHC_BASE8000 = 'OP05-065'; // San-Gorou, Purple, cost 6, 8000
/** ST14-005 Tony Tony.Chopper (Black, cost 4, 6000, {Straw Hat Crew}): the name the Activate excludes. */
export const CHOPPER_V = 'ST14-005';
/** OP15-085 Tony Tony.Chopper itself. */
export const CHOPPER = 'OP15-085';
/** {Sky Island} vanillas: Holly (3, 5000), Seto (5, 6000), Nola (5, 7000), Wyper (6, 7000), Kalgara (6, 8000). */
export const SI_HOLLY = 'OP05-110';
export const SI_SETO = 'OP12-103';
export const SI_NOLA = 'OP05-108';
export const SI_WYPER = 'OP12-114';
export const KALGARA_V = 'OP08-099';
/** {Thriller Bark Pirates} vanilla: Lola (Black, cost 4, 6000). */
export const TBP_V = 'OP06-094';
/** Yellow vanilla Character, cost 2, 4000 (Baby 5). */
export const YELLOW_C2 = 'OP12-111';
/** Yellow Stage, cost 2 (Egghead; its only text is an [End of Your Turn]). */
export const YELLOW_STAGE = 'OP07-117';
/** Yellow vanilla Character, cost 3 (Holly): too dear for Octoballoon. */
export const YELLOW_C3 = 'OP05-110';

/** `n` copies of a vanilla, as filler. */
export const fill = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** p1's board with `n` active DON!!. */
export const donArea = (active: number, rested = 0) => ({ costArea: { active, rested } });

/** A Main Phase position for p1 holding `hand` (plus whatever `p1` adds), p2 with a plain Leader. */
export function mine(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return game(p1, { leader: PLAIN_BLUE, ...p2 });
}

/** p2 (active) runs a planted "K.O. your opponent's Characters named like `card`" against p1. */
export function koOf(g: TestGame, card: string): void {
  plantOpponentEffect(g, {
    ko: { from: 'characters', owner: 'opponent', filter: { name: cards()(card)!.name } },
  });
}

export const handOf = (g: TestGame, p: 'p1' | 'p2' = 'p1') => names(g, p, 'hand');
