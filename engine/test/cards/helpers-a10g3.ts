/**
 * Constants and helpers for the OP-10 group 3 card tests (OP10-075 to OP10-111). Every constant is
 * a vanilla, or a card whose text is inert where the test puts it (a hand, a deck, a trash, a target).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp, internals } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, V } from './helpers.ts';

export { PLAIN_BLUE, V };
export {
  accept,
  addMost,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  hand,
  none,
  option,
  passBlock,
  payDon,
  pick,
  play,
  takeDamage,
  trash,
} from './helpers.ts';
export { activate, canPick, pickable } from './helpers-w3s.ts';
export { finishOrder } from './helpers-luffyace.ts';
export { canAccept, canActivate, canAttack, offers } from './helpers-op16g1.ts';
export { oppAttack } from './helpers-op15g2.ts';

/** OP04-039 Rebecca Leader ({Dressrosa}); cannot attack, its Activate is unscripted (inert here). */
export const DRESS_LEADER = 'OP04-039';
/** OP15-057 Dressrosa Kingdom Stage ({Dressrosa}); only an [On Play] (inert on the field). */
export const DRESS_STAGE = 'OP15-057';
/** OP01-060 Doflamingo Leader ({Donquixote Pirates}); unscripted. */
export const DON_LEADER = 'OP01-060';
/** OP16-080 Teach Leader ({Blackbeard Pirates}); unscripted. */
export const BB_LEADER = 'OP16-080';
/** ST01-001 Luffy Leader ({Supernovas}); only an [Activate: Main] (inert unless used). */
export const SUPER_LEADER = 'ST01-001';
/** OP02-049 Emporio.Ivankov Leader ({Revolutionary Army}); only an [End of Your Turn] (inert here). */
export const RA_LEADER = 'OP02-049';
/** ST03-001 Crocodile (Blue) and ST08-001 Luffy ({Straw Hat Crew}): Leaders with none of the types above. */
export const OTHER_LEADER = 'ST08-001';

/** {Dressrosa} Characters (vanilla): [Bellamy] cost 2, [Blue Gilly] cost 3, [Viola] cost 5. */
export const DRESS2 = 'OP01-076';
export const DRESS3 = 'OP10-054';
export const DRESS5 = 'EB03-030';
/** {Blackbeard Pirates} vanillas: [Avalo Pizarro] cost 4, [Sanjuan.Wolf] cost 5; [Kuzan] ST27-003 is cost 6. */
export const BB4 = 'OP09-082';
export const BB5 = 'OP10-084';
export const BB6 = 'ST27-003';
/** {Thriller Bark Pirates}: [Lola] cost 4 and [Gecko Moria] cost 4 (vanilla), [Perona] ST12-005 cost 4 (vanilla). */
export const TB_A = 'OP06-094';
export const TB_B = 'OP02-054';
export const PERONA_V = 'ST12-005';
/** {Supernovas} Characters: [Urouge] yellow cost 5 / 7000, [Cavendish] yellow cost 6, [Apoo] red cost 3, [Zoro] green cost 4. */
export const SUPER5 = 'OP10-101';
export const SUPER6 = 'OP10-105';
export const SUPER_RED3 = 'OP14-008';
export const SUPER_GREEN4 = 'OP02-043';
/** [Scratchmen Apoo] yellow {Supernovas} cost 4 (ST36-003): a second Apoo. */
export const APOO_Y = 'ST36-003';
/** Yellow Character with no {Supernovas} type: [Jinbe] cost 4 / 5000. */
export const YELLOW_NON_SUPER = 'EB02-055';
/** {Revolutionary Army} vanillas: cost 5 / 6000 (black) and cost 4 / 6000 (yellow). */
export const RA5 = 'OP12-083';
export const RA4 = 'OP09-113';
/** {Kid Pirates} vanilla, cost 2 (Wire). */
export const KID2 = 'OP01-053';
/** [Monkey.D.Luffy] {Supernovas} cost 3 (P-006) and a [Kuzan] (the card itself, OP10-082). */
export const LUFFY_S = 'P-006';
export const KUZAN = 'OP10-082';

/** `n` copies of a card. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** p1's turn 3 over `leader` with `active` active DON!!, p2 over a plain Blue Leader. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  leader: CardId = OTHER_LEADER,
  active = 10,
): TestGame {
  return game({ leader, costArea: { active, rested: 0 }, ...p1 }, { leader: PLAIN_BLUE, ...p2 });
}

/** Card ids of a zone, in order. */
export const idsOf = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** True when the decision now open is a `main` decision. */
export const atMain = (g: TestGame): boolean => dec(g)?.kind === 'main';

/** K.O. `card` of `who` now, as an effect of `by`. */
export function koBy(g: TestGame, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

/** Instance ids offered right now as a pick. */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** Whether the pending decision is of this kind. */
export const kindIs = (g: TestGame, kind: string): boolean => dec(g)?.kind === kind;

/** A Leader/Character placement with `n` DON!! given. */
export const withDon = (card: CardId, n = 1) => ({ card, don: n });

export { game } from './helpers.ts';
export { koedInBattle } from './helpers-op15g2.ts';

/** Add `amount` to the current cost of `who`'s Character `card` for this turn (its base cost is unchanged). */
export function addCost(g: TestGame, who: 'p1' | 'p2', card: string, amount: number): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target: g.find(who, 'characters', card),
      amount,
      duration: { kind: 'thisTurn', turn: internals(g.state).turn },
      controller: who,
    },
  }).state;
}
