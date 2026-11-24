/**
 * Helpers for the EB-04 group-B independent card tests (EB04-028 .. EB04-060). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 */
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donChoices, kind } from '../kit.ts';

export * from '../op15/kit-op15a.ts';
export { result, turn } from '../../helpers.ts';
export type { TestGame };

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const LB = {
  /** OP02-093 Smoker: Black, 5000, 5 Life, {Navy}. Only a [DON!! x1][Activate: Main]. */
  navy: 'OP02-093',
  /** OP07-059 Foxy: Purple, 5000, 5 Life, {Foxy Pirates}. Only a [When Attacking]. */
  foxy: 'OP07-059',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** OP07-001 Monkey.D.Dragon: Red, 5000, 5 Life, {Revolutionary Army}. [Activate: Main] only. */
  army: 'OP07-001',
  /** PRB01-001 Sanji: Red, 5000, 5 Life, {Straw Hat Crew}. [Activate: Main] only. Named [Sanji]. */
  sanji: 'PRB01-001',
  /** ST29-001 Monkey.D.Luffy: Yellow, 5000, 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}. [When Attacking] only. */
  egghead: 'ST29-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}. [Activate: Main] only. Neutral. */
  neutral: 'ST03-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life. Vanilla. */
  luffy: 'ST01-001',
} as const;

/** ST01-014 Guard Point: Red Event, cost 1. Used as an Event card in the trash or hand. */
export const EVT = 'ST01-014';

/**
 * Pay the pending exact-1 hand cost (`choose`, purpose cost) with the nth copy of `card` in the
 * deciding player's hand, by one raw pick. Never sends `done`, so it cannot answer a later pick.
 */
export function payCard(g: TestGame, card: CardId, nth = 0): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.purpose !== 'cost') {
    throw new Error(`Expected a cost choose, got ${d?.kind}/${d?.purpose}: ${d?.prompt}`);
  }
  const inst = g.find(g.decider, 'hand', card, nth);
  act(g, { type: 'pick', choice: inst });
}

/** One raw pick of `inst` in the pending `choose` (any purpose). Never sends `done`. */
export function pickRaw(g: TestGame, inst: InstanceId): void {
  const d = decision(g);
  if (d?.kind !== 'choose') throw new Error(`Expected a choose, got ${d?.kind}: ${d?.prompt}`);
  act(g, { type: 'pick', choice: inst });
}

/**
 * Answer a pending "up to N" `choose` with exactly these instances (raw picks), then `done` when
 * fewer than the maximum were picked. Strict: fails if the pending decision is not a `choose`.
 */
export function pickUpTo(g: TestGame, insts: InstanceId[]): void {
  const d = decision(g);
  if (d?.kind !== 'choose') throw new Error(`Expected a choose, got ${d?.kind}: ${d?.prompt}`);
  const max = d.max ?? insts.length;
  for (const i of insts) act(g, { type: 'pick', choice: i });
  if (insts.length < max) act(g, { type: 'done' });
}

/** Return `n` DON!! to the DON!! deck for a pending DON!! −N cost (active first, then rested). */
export function payDonAny(g: TestGame, n: number): void {
  for (let i = 0; i < n; i++) {
    // With one class of DON!! only, the engine pays on its own and asks nothing.
    const opts = donChoices(g);
    if (!opts.length) return;
    const want = opts.find((o) => o.from === 'costActive') ?? opts[0];
    act(g, { type: 'pick', choice: want! });
  }
}

/** DON!! on the field of `who`: cost area active, rested, and given. */
export function donTotal(g: TestGame, who: PlayerId = 'p1'): number {
  const d = queries.don(g.state, who);
  return d.active + d.rested + d.given;
}

/** True when the card instance is rested. */
export function isRestedInst(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** DON!! cards left in the DON!! deck of `who`. */
export function donDeckN(g: TestGame, who: PlayerId = 'p1'): number {
  return queries.don(g.state, who).deck;
}

/** DON!! in the cost area of `who`: [active, rested]. */
export function donCost(g: TestGame, who: PlayerId = 'p1'): [number, number] {
  const d = queries.don(g.state, who);
  return [d.active, d.rested];
}

/** The pending decision's kind, or null. */
export function pkind(g: TestGame): string | null {
  return decision(g)?.kind ?? null;
}

/** True when the pending decision is a `choose` offering `inst`. */
export function offers(g: TestGame, inst: InstanceId): boolean {
  return kind(g) === 'choose' && choices(g).includes(inst);
}

/** Pick the DON!! class `from` in the pending `choose`. */
export function pickDon(g: TestGame, from: 'costActive' | 'costRested' = 'costActive'): void {
  const want = donChoices(g).find((o) => o.from === from);
  if (!want) throw new Error(`No ${from} DON!! offered`);
  act(g, { type: 'pick', choice: want });
}
