/**
 * Helpers for the leftovers group-D independent tests (ST33-004, ST28-004, OP11-088). Public API,
 * frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt
 * and fails on anything else. Cards are played with raw actions (`playRaw`).
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { queries } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';

export * from '../op14/kit-op14d.ts';

/** Current power of an instance (null for a card with none). */
export function pwr(g: TestGame, i: InstanceId): number | null {
  return g.card(i).power;
}

/** Current cost of an instance. */
export function cst(g: TestGame, i: InstanceId): number | null {
  return g.card(i).cost;
}

/** `{deck, active, rested, given}` DON!! counts of a player. */
export function dons(g: TestGame, p: PlayerId = 'p1') {
  const d = queries.don(g.state, p);
  return { deck: d.deck, active: d.active, rested: d.rested, given: d.given };
}

/** The pending decision's kind (null when none). */
export function pendingKind(g: TestGame): string | null {
  return decision(g)?.kind ?? null;
}

/** True when `card` can be played right now from `who`'s hand (legal `playCard` action). */
export function playable(g: TestGame, card: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'playCard' && a.card === card);
}

/** Raw `optional` answer, strict about the kind of the pending prompt. */
export function answerOptional(g: TestGame, accept: boolean, who: PlayerId = 'p1'): void {
  const d = decision(g);
  if (!d || d.kind !== 'optional' || d.player !== who) {
    throw new Error(
      `Expected optional for ${who}, got ${d ? d.kind + ' for ' + d.player : 'none'}`,
    );
  }
  act(g, { type: 'optional', accept });
}

export type { CardId };
