/**
 * Helpers for the EB-03 group-B independent card tests (EB03-035 to EB03-062, 21 cards). Public
 * API, frozen fixtures and the earlier kits only. Scenery stats are noted next to each constant;
 * tests repeat the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind: a test fails on the wrong prompt rather than
 * skipping it. Helpers that send `done` after the last pick are avoided where a test asserts
 * whether a prompt appears (docs/reviews/m6b-OP-16.md R6): those tests use raw `g.act`.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';
import { asksDonCount, takeDon } from '../op16/kit-op16b.ts';

export * from '../op14/kit-op14b.ts';

/** Leaders used as scenery. */
export const LB = {
  /** OP09-022 Lim: Green/Purple (multicoloured), {ODYSSEY}. Characters are played rested; [Activate: Main] only. */
  lim: 'OP09-022',
  /** OP07-097 Vegapunk: Yellow, 5000, {Scientist}/{Egghead}. Named [Vegapunk]. Cannot attack. */
  vegapunk: 'OP07-097',
  /** ST29-001 Monkey.D.Luffy: Yellow, 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}. */
  eggheadLuffy: 'ST29-001',
  /** OP06-021 Perona: Green/Black (multicoloured), {Thriller Bark Pirates}. Named [Perona]. */
  perona: 'OP06-021',
  /** OP11-022 Shirahoshi: Green/Yellow, {Merfolk}/{Fish-Man Island}. Named [Shirahoshi]. Cannot attack. */
  shirahoshi: 'OP11-022',
  /** OP03-040 Nami: Blue, 5000, {East Blue}. Named [Nami]. */
  nami: 'OP03-040',
  /** OP05-002 Belo Betty: Red/Yellow, {Revolutionary Army}. */
  ra: 'OP05-002',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, {Big Mom Pirates}. */
  yellow: 'OP03-099',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, {Straw Hat Crew}. Vanilla, not multicoloured. */
  luffy: 'ST01-001',
  /** ST04-001 Kaido: Purple, 5000, {Animal Kingdom Pirates}. */
  purple: 'ST04-001',
  /** ST12-001 style scenery is avoided; ST05-001 Shanks: Purple, {FILM}. */
  shanks: 'ST05-001',
} as const;

/** Pick the pending cost `choose`'s DON!! class (active DON!!) `n` times, strictly (a DON!! −N / rest cost). */
export function costDon(g: TestGame, n: number, from: 'costActive' | 'costRested' = 'costActive') {
  for (let i = 0; i < n; i++) {
    need(g, 'choose');
    const want = donChoices(g).find((o) => o.from === from);
    if (!want) throw new Error(`No ${from} DON!! offered`);
    act(g, { type: 'pick', choice: want });
  }
}

/** Instances in a zone with this card id, as instance ids. */
export function allOf(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
): InstanceId[] {
  return g
    .zone(who, zone)
    .filter((c) => c.card === card)
    .map((c) => c.instance);
}

/** True when a `choose` is pending that may end with no pick and offers no candidates. */
export function emptyPick(g: TestGame): boolean {
  return kind(g) === 'choose' && choices(g).length === 0 && canFinish(g);
}

/** Assert the pending decision is an "up to" `choose` and return its sorted candidates as card ids. */
export function candidates(g: TestGame): (CardId | null)[] {
  need(g, 'choose');
  return choices(g)
    .map((i) => g.card(i).card)
    .sort();
}

/** Describe the pending decision for failure messages. */
export function pend(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.kind}/${d.purpose}:${d.prompt}` : 'none';
}

/**
 * "Add up to N DON!!" asks a count (most first) per the engine's convention; answer it with `n`
 * when it is pending, do nothing when the engine added without asking.
 */
export function addDonAnswer(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  if (asksDonCount(g, who)) takeDon(g, n, who);
}

/**
 * Pick one card (by card id) in the pending `choose` with a raw action and nothing else: unlike
 * `pickCards` it never sends `done`, so a following empty "up to" prompt stays visible.
 */
export function pickRaw(g: TestGame, card: CardId, nth = 0): void {
  need(g, 'choose');
  const hits = choices(g).filter((i) => g.card(i).card === card);
  const hit = hits[nth];
  if (!hit) throw new Error(`${card} is not offered; offered ${candidates(g)}`);
  act(g, { type: 'pick', choice: hit });
}

void expect;
