/**
 * Constants and helpers for the block 5 starter group 2 card tests (ST-33, ST-34, ST-35, ST-36 and
 * the block X / block 1 exceptions). Every Character below is a vanilla (no effect text) and every
 * Leader's effects are inert in these positions (Activate: Main or End of Turn only).
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

/** ST06-001 Sakazuki: Black Leader, {Navy}; [Activate: Main] only. */
export const NAVY_LEADER = 'ST06-001';
/** ST01-001 Monkey.D.Luffy: Red Leader, {Straw Hat Crew}{Supernovas}; [Activate: Main] only. */
export const SUPERNOVAS_LEADER = 'ST01-001';
/** ST02-001 Eustass"Captain"Kid: Green Leader, {Kid Pirates}{Supernovas}; [Activate: Main] only. */
export const KID_LEADER = 'ST02-001';
/** OP02-001 Edward.Newgate: Red Leader, 6000, {Whitebeard Pirates}; [End of Your Turn] only. */
export const WB_LEADER = 'OP02-001';

/** Navy vanillas: [id, colour, cost, power]. */
export const NAVY = {
  doberman: 'OP02-107', // Black, cost 2, 4000
  fullbody: 'OP12-052', // Blue, cost 4, 6000
  sengoku: 'OP06-049', // Blue, cost 5, 7000
  jango: 'OP12-045', // Blue, cost 6, 8000
  giant: 'OP05-044', // Blue, cost 8, 10000
} as const;
/** {Revolutionary Army} vanillas: Black, cost 2, 4000 / Black, cost 5, 6000. */
export const RA_4000 = 'EB05-041';
export const RA_6000 = 'OP13-088';
/** Yellow vanilla {Supernovas}, cost 5, 7000. */
export const SUPERNOVA = 'OP10-101';
/** Characters with 2000 base power (their printed [Trigger] is inert on the field). */
export const P2000_A = 'OP14-102';
export const P2000_B = 'OP08-104';
/** Vanilla Blockers (printed keyword in the card data): cost 2, 2000 power / cost 3, 3000 power. */
export const BLOCKER_2000 = 'EB01-017';
export const BLOCKER_3000 = 'OP05-112';
/** Red vanilla, cost 4, 6000, {Whitebeard Pirates}. */
export const WHITEBEARD = 'OP02-003';

export const idsOf = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** The instance ids a pending `choose` decision offers (single picks). */
export function offers(g: TestGame): InstanceId[] {
  return g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
}

export const canAccept = (g: TestGame): boolean =>
  g.isLegal({ type: 'optional', accept: true, player: g.decider });

/**
 * p1's `attacker` (already on the field, active) attacks p2's Leader. Returns with whatever p1
 * owes first ([When Attacking] cost prompt, or the Block Step for p2).
 */
export function attackLeader(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  attacker: string,
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(p1, { leader: PLAIN_BLUE, ...p2 });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', attacker), target: g.leader('p2') });
  return g;
}

/** Run an open battle to its end with no block and no counter. */
export function finishBattle(g: TestGame): void {
  passBlock(g);
  endCounter(g);
}

/**
 * p2's turn: p2's `V.c6` (8000) attacks p1's rested `target`; nobody blocks or counters and the
 * target is K.O.'d. Returns with p1's [On K.O.] (if any) pending.
 */
export function koedInBattle(
  target: string,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { ...p1, characters: [{ card: target, rested: true }, ...(p1.characters ?? [])] },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c6, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c6),
    target: g.find('p1', 'characters', target),
  });
  passBlock(g);
  endCounter(g);
  return g;
}

/**
 * p2's turn: p2's 9000 Character hits p1's Leader and p1 owes the [Trigger] decision on `top`, the
 * top Life card (a second Life card stays). `p1` and `p2` override the two sides.
 */
export function triggerGame(
  top: string,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { life: [top, V.c1], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7], ...p2 },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

export { dec, expectDecision };
