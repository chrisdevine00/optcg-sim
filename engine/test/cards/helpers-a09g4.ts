/**
 * Constants and helpers for the OP-09 group 4 card tests (OP09-019 to -021, -039 to -041, -057 to
 * -060, -079, -080, -096 to -099, -112 to -118). Every constant is a vanilla, or a card whose text
 * is inert where the test puts it (a hand, a deck, a trash, a target, a Leader that is not used).
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp, internals } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';

export { PLAIN_BLUE, V, game };
export {
  accept,
  BLUE,
  PURPLE,
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
  times,
  trash,
} from './helpers.ts';
export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { counterStep, finishOrder, useCounter } from './helpers-luffyace.ts';
export { canActivate, canAttack } from './helpers-op16g1.ts';
export { damageGame } from './helpers-hancock-rosi.ts';
export { koedInBattle, plant } from './helpers-op15g2.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';

/** ST05-001 Shanks Leader: {Red-Haired Pirates}; only an [Activate: Main] (inert unless used). */
export const RHP_LEADER = 'ST05-001';
/** OP09-022 Lim Leader: {ODYSSEY}; its [Activate: Main] is never used here. */
export const ODYSSEY_LEADER = 'OP09-022';
/** OP09-042 Buggy Leader: {Cross Guild}; its [Activate: Main] is never used here. */
export const CG_LEADER = 'OP09-042';
/** OP16-080 Teach Leader: {Blackbeard Pirates}; its text only matters for its own Characters. */
export const BBP_LEADER = 'OP16-080';
/** OP02-049 Emporio.Ivankov Leader: {Revolutionary Army}; only an [End of Your Turn] (inert here). */
export const RA_LEADER = 'OP02-049';
/** ST01-001 Luffy Leader: {Straw Hat Crew}; none of the types above. */
export const OTHER_LEADER = 'ST01-001';

/** {Red-Haired Pirates} vanillas: [Rockstar] cost 4 / 6000, [Yasopp] cost 6 / 8000. */
export const RHP4 = 'OP09-016';
export const RHP6 = 'P-023';
/** {ODYSSEY} vanilla: cost 4 / 6000. */
export const OD4 = 'OP09-038';
/** {Cross Guild} vanillas: [Mr.1] cost 5 / 7000, [Buggy] cost 6 / 7000. */
export const CG5 = 'OP09-055';
export const CG6 = 'OP12-049';
/** {Blackbeard Pirates} vanillas: cost 4 / 6000 and cost 5 / 7000. */
export const BB4 = 'OP09-082';
export const BB5 = 'OP10-084';
/** {Revolutionary Army} vanillas: [Morley] cost 4 / 6000, [Inazuma] cost 5 / 6000. */
export const RA4 = 'OP09-113';
export const RA5 = 'OP12-083';
/** [Maynard] {Navy}, cost 2, [Blocker]; nothing else. */
export const BLOCKER = 'OP05-052';
/** Characters with a [Trigger] (only the [Trigger] text, inert on the field): cost 2, 3, 4. */
export const TRIG2 = 'OP01-082';
export const TRIG3 = 'OP03-100';
export const TRIG4 = 'EB02-055';
/** {Straw Hat Crew} vanillas: [Franky] cost 4 / 6000 (red), [Sanji] cost 1 / 3000 (red). */
export const SHC4 = 'ST01-010';
export const SHC1 = 'OP04-007';
/** An Event with no script, cost 3 (Draw 2) and cost 1. */
export const EVENT3 = 'OP03-056';
/** A Stage with no script. */
export const STAGE = 'OP04-096';

/** `n` copies of a card. */
export const rep = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** A rested placement. */
export const rested = (card: CardId) => ({ card, rested: true });

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

/** Instance ids offered right now as a pick. */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** Whether the pending decision is of this kind. */
export const kindIs = (g: TestGame, kind: string): boolean => dec(g)?.kind === kind;

/** Answer every pending `order` decision in canonical order, then expect the main decision. */
export function expectMain(g: TestGame, who: 'p1' | 'p2' = 'p1'): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
  expectDecision(g, 'main', who);
}

/** K.O. `who`'s `card` now, as an effect of `by`. */
export function koBy(g: TestGame, who: 'p1' | 'p2', card: string, by: 'p1' | 'p2', nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

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

/** Add `amount` to the current power of `target` for this turn. */
export function addPower(g: TestGame, target: InstanceId, amount: number): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount,
      duration: { kind: 'thisTurn', turn: internals(g.state).turn },
      controller: 'p1',
    },
  }).state;
}
