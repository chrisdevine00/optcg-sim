/**
 * Constants and helpers for the OP-09 group 3 card tests (OP09-075 ... OP09-111). Every constant is
 * a vanilla, or a card whose text is inert where the test puts it (a Leader, a target, a hand).
 */
import type { CardId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

export * from './helpers-a10g3.ts';
export { times } from './helpers.ts';
export { pickableCards, pickCard, settle } from './helpers-op13g3.ts';
export { counterGame } from './helpers-op14g4.ts';

/** {Kid Pirates}{Supernovas} Leader (only an [Activate: Main], inert unless used). */
export const KID_LEADER = 'ST02-001';
/** {Blackbeard Pirates} Leader (its text is for the opponent's turn only, inert on a test turn). */
export const BB_LEADER = 'OP16-080';
/** {Egghead} Leader [Vegapunk] (cannot attack; its Activate is never used). */
export const EGG_LEADER = 'OP07-097';
/** A [Nico Robin] Leader (its text needs Wisdom Characters, inert here). */
export const ROBIN_LEADER = 'EB05-010';
/** A Leader with none of the types above and not [Nico Robin]: ST08-001 (the shared OTHER_LEADER). */

/** {Thriller Bark Pirates}: [Kumacy] cost 1, [Cerberus] cost 2, [Victoria Cindry] cost 3, [Lola] cost 4. */
export const TB = { c1: 'OP14-102', c2: 'OP06-087', c3: 'OP14-109', c4: 'OP06-094' } as const;
/** Yellow Characters: cost 3 / 5000 {Sky Island} (vanilla) and cost 4 / 6000 {Revolutionary Army}. */
export const Y3 = 'OP05-110';
export const Y4 = 'OP09-113';
/** A card with a [Trigger] (cost 2) and a card of the same kind without one. */
export const WITH_TRIGGER = 'OP01-082';
/** A [Blackbeard Pirates] vanilla Character (cost 4) for a searched deck. */
export const BB_CARD = 'OP09-082';

/**
 * The [Trigger] position: p2 attacks p1's Leader with a 9000-power Character; p1's top Life card is
 * `top`, and the game stops at the [Trigger] decision (p1 `leader`, extra p1 and p2 specs).
 */
export function hitWith(
  top: string,
  leader: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { leader, life: [top, V.c1], ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Hand card ids of a player. */
export const handIds = (g: TestGame, p: PlayerId): CardId[] => g.zone(p, 'hand').map((c) => c.card);

/** Is a decision of this kind pending? */
export const pending = (g: TestGame, kind: string): boolean => dec(g)?.kind === kind;
