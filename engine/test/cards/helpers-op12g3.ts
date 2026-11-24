/**
 * Constants and helpers for the OP-12 group 3 card tests (OP12-078 to OP12-119). Every constant is
 * a vanilla, or a card whose text is inert where the test puts it (a hand, a deck, a trash, a target).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { BLUE, dec, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

export { BLUE, PURPLE, PLAIN_BLUE, V };
export { activate, canPick, pickable } from './helpers-w3s.ts';
export { finishOrder } from './helpers-luffyace.ts';
export { counterStep, useCounter } from './helpers-luffyace.ts';
export { canActivate, idsOf, offers } from './helpers-op13g3.ts';

/** OP02-049 Emporio.Ivankov Leader ({Revolutionary Army}); only an [End of Your Turn] (inert here). */
export const RA_LEADER = 'OP02-049';
/** ST01-001 Luffy Leader ({Straw Hat Crew}): not a Revolutionary Army Leader. */
export const OTHER_LEADER = 'ST01-001';
/** ST08-001 [Monkey.D.Luffy] Leader; its [Your Turn] text is unscripted (inert). */
export const LUFFY_LEADER = 'ST08-001';
/** OP02-026 [Sanji] Leader; its text is unscripted (inert). */
export const SANJI_LEADER = 'OP02-026';
/** {Revolutionary Army} vanillas: [Koala] cost 2 / 4000 and a cost 5 / 6000 one. */
export const RA2 = 'EB05-041';
export const RA5 = 'OP12-083';
/** [Monkey.D.Dragon] {Revolutionary Army}, cost 8 / 9000 (its [Rush] is inert on a field). */
export const RA8 = 'OP07-015';
/** [Issho] Navy vanilla, cost 8 / 10000 (not {Revolutionary Army}). */
export const C8 = 'OP12-082';
/** {Animal Kingdom Pirates}{SMILE} vanillas (cost 3 / 5000, cost 2 / 4000) and a non-SMILE cost 4. */
export const SMILE3 = V.c3;
export const SMILE2 = V.c2;
export const NONSMILE4 = V.c4;
/** [Trafalgar Law] Character (cost 1 / 1000, {Heart Pirates}); its [Blocker] is inert on a field. */
export const LAW_CHAR = 'ST03-008';
/** [Trafalgar Law] Leader (OP01-002); its [Activate: Main] is unscripted (inert). */
export const LAW_LEADER = 'OP01-002';
/** {Neptunian} vanilla, cost 6 / 7000 ([Bird Neptunian]); a {Merfolk} [Shirahoshi] cost 2 and cost 4. */
export const NEPTUNIAN = 'OP11-033';
export const SHIRAHOSHI2 = 'EB01-057';
export const SHIRAHOSHI4 = 'ST08-006';
/** {Shandian Warrior} Characters (vanilla): [Seto] cost 5, [Wyper] cost 6; and {Shandian Warrior} Event OP08-116. */
export const SHANDIAN5 = 'OP12-103';
export const SHANDIAN6 = 'OP12-114';
export const SHANDIAN_EVENT = 'OP08-116';
/** [Mont Blanc Noland] (cost 5) and a Character that is neither Shandian nor Noland. */
export const NOLAND = 'OP08-109';

const TEN = { active: 10, rested: 0 };

/** p1's turn 3: p1 over a Revolutionary Army Leader with 10 active DON!!, p2 over a plain Blue Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game({ leader: RA_LEADER, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/** `n` copies of a card. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** Card names (ids) of a player's zone, in order. */
export const cardsIn = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** The instance ids offered to the pending choice. */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** The pending decision's kind. */
export const kind = (g: TestGame) => dec(g)?.kind;

/** Answer every pending order decision with its first legal order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}
