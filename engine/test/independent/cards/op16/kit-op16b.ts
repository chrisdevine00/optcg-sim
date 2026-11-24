/**
 * Helpers for the OP-16 group-B independent card tests (OP16-038 to OP16-081). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 *
 * Answer helpers here accept exactly one named prompt kind (`yes` / `no` need an `optional`,
 * `payHand` needs a cost `choose`, ...): a test fails on the wrong prompt rather than skipping it.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { act, decision, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { canFinish, choices, kind, skipUnusable } from '../kit.ts';
import { accept, choose, need, payDon, playCard } from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';

/** Leaders. Colours do not matter to the scenario. */
export const LDR = {
  /** OP02-071 Magellan: 6000, 5 Life, {Impel Down}. Only a [Your Turn] power bonus when DON!! is returned. */
  impel: 'OP02-071',
  /** ST06-001 Sakazuki: 5000, 5 Life, {Navy}. Only an [Activate: Main]. */
  navy: 'ST06-001',
  /** OP01-060 Donquixote Doflamingo: 5000, 5 Life, {Donquixote Pirates}/{The Seven Warlords of the Sea}. [DON!! x2] [When Attacking] only. */
  dp: 'OP01-060',
  /** EB01-040 Kyros: 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dressrosa: 'EB01-040',
  /** ST01-001 Monkey.D.Luffy: 5000, 5 Life, {Straw Hat Crew}. Only an [Activate: Main]. */
  luffy: 'ST01-001',
  /** ST09-001 Yamato: 5000, 5 Life, {Land of Wano}. */
  wano: 'ST09-001',
  /** OP05-022 Donquixote Rosinante: 5000, 4 Life, {Donquixote Pirates}/{Navy}; [Blocker]. */
  dpNavy: 'OP05-022',
} as const;

/** Vanilla {Impel Down} Characters, all with distinct names unless noted. */
export const ID = {
  /** OP02-053 Crocodile: cost 5, 7000, Counter +1000, {Impel Down}/{Former Baroque Works}. Same name as OP16-045. */
  crocodile: 'OP02-053',
  /** OP02-084 Blugori: cost 1, 3000, Counter +1000, {Animal}/{Impel Down}. */
  blugori: 'OP02-084',
  /** OP02-088 Sphinx: cost 4, 6000, Counter +1000, {Animal}/{Impel Down}. */
  sphinx: 'OP02-088',
  /** OP11-064 Saldeath: cost 6, 8000, Counter +1000, {Impel Down}. */
  saldeath: 'OP11-064',
  /** OP17-051 Jinbe: cost 7, 8000, Counter +2000, {Fish-Man}/{Impel Down}/{The Sun Pirates}. */
  jinbe: 'OP17-051',
  /** ST30-013 Mr.2.Bon.Kurei(Bentham): cost 4, 6000, Counter +1000, {Impel Down}/{Former Baroque Works}. */
  bentham: 'ST30-013',
  /** EB01-032 Army Wolves: cost 5, 7000, Counter +1000, {Animal}/{Impel Down}. */
  wolves: 'EB01-032',
} as const;

/** Other scenery. */
export const SCN2 = {
  /** OP04-096 Corrida Coliseum: Stage, cost 1, {Dressrosa}. Its text only matters with a Dressrosa Leader. */
  dressStage: 'OP04-096',
  /** OP09-077 Gum-Gum Lightning: Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
} as const;

/** Scenery for battles. */
export const BAT = {
  /** OP04-012 Nefeltari Cobra: cost 2, power 0, Counter +1000, {Alabasta}. Inert alone. */
  cobra0: 'OP04-012',
  /** OP13-009 Curly.Dadan: cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  dadan2000: 'OP13-009',
  /** OP02-014 Whitey Bay: cost 1, 2000, Counter +1000. Inert without DON!!. */
  whitey2000: 'OP02-014',
} as const;

/**
 * Pay a "rest 1 of your X" or "return/trash 1 of your Characters" cost that is a `choose` with
 * purpose `cost`: pick `which` if given, else the first candidate offered. If the engine resolved
 * the cost by itself (one candidate), nothing is asked and nothing is done. Never touches an
 * `optional`.
 */
export function payCost(g: TestGame, which?: InstanceId): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.purpose !== 'cost') return;
  const offered = choices(g);
  const pick = which ?? offered[0];
  if (!pick || !offered.includes(pick)) {
    throw new Error(`Cost candidate ${which} not offered; offered ${offeredNow(g)}`);
  }
  act(g, { type: 'pick', choice: pick });
  const next = decision(g);
  if (
    next?.kind === 'choose' &&
    next.purpose === 'cost' &&
    canFinish(g) &&
    choices(g).length === 0
  ) {
    act(g, { type: 'done' });
  }
}

/**
 * "Add up to N DON!!" asks a count (E-Q11): a `choose` with purpose `mode` whose options are the
 * counts. The ids of the counts offered, e.g. ['2', '1', '0'].
 */
export function donCountOptions(g: TestGame, who: PlayerId = 'p1'): string[] {
  const d = need(g, 'choose', who);
  expect(d.purpose).toBe('mode');
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending DON!! count question with exactly `n`; throws if `n` is not offered. */
export function takeDon(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  const offered = donCountOptions(g, who);
  if (!offered.includes(String(n))) throw new Error(`Count ${n} not offered; offered ${offered}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True when a DON!! count question is pending for `who`. */
export function asksDonCount(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who && d.purpose === 'mode';
}

/**
 * The deciding player (p2 on their own turn) plays OP09-077 Gum-Gum Lightning (DON!! -2) and K.O.s
 * `target`, a Character of 6000 power or less. Stops at the first decision the K.O. causes.
 */
export function opponentKOs(g: TestGame, target: InstanceId): void {
  playCard(g, SCN2.lightning);
  accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

/** The defender blocks with `blocker` (the Block Step decision must be pending). */
export function block(g: TestGame, blocker: InstanceId): void {
  need(g, 'block');
  act(g, { type: 'block', blocker });
}

/** The nth card with this id in a zone, as an instance. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** True when the card (an instance) is rested. */
export function rested(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** Play a card from p1's hand; the effect's first decision (if any) is left pending. */
export function put(g: TestGame, card: CardId, who: PlayerId = 'p1'): InstanceId {
  const i = g.find(who, 'hand', card);
  play(g, i);
  return i;
}

/**
 * After playing a card whose effect has a "you may <cost>:" the engine asks `optional`, or asks it
 * with "use" unavailable when the cost cannot be paid. Returns whether "use" was legal and answers
 * yes or no as told. Throws if no optional is pending.
 */
export function answerMay(g: TestGame, use: boolean, who: PlayerId = 'p1'): boolean {
  need(g, 'optional', who);
  const canUse = g.legal().some((a) => a.type === 'optional' && a.accept);
  act(g, { type: 'optional', accept: use && canUse });
  return canUse;
}

/**
 * The cost cannot be paid: either no question is asked, or an `optional` is asked with "use" not
 * legal (answered no). Throws if the pending decision is an `optional` that can be used.
 */
export function mustBeUnpayable(g: TestGame, who: PlayerId = 'p1'): void {
  const d = decision(g);
  if (d?.kind !== 'optional' || d.player !== who) return;
  expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  act(g, { type: 'optional', accept: false });
}

/** True when the pending decision is a Main-Phase decision for `who`. */
export function backAtMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** The instances a pending `choose` offers, as card ids, in sorted order. */
export function offeredNow(g: TestGame): (CardId | null)[] {
  return choices(g)
    .map((i) => g.card(i).card)
    .sort();
}

/** Throw unless a `choose` that may be left empty is pending, then choose nothing. */
export function declineChoice(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error('This choose does not allow choosing nothing');
  act(g, { type: 'done' });
}

/** The pending decision kind, for assertions. */
export function pending(g: TestGame): string | null {
  return kind(g);
}

/** Clears a harmless unusable-cost question for `who` (the engine asks with "use" unavailable). */
export function clearUnusable(g: TestGame, who: PlayerId = 'p1'): void {
  skipUnusable(g, who);
}
