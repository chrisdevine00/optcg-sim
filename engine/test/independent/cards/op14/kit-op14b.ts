/**
 * Helpers for the OP-14 group-B independent card tests (OP14-035 to OP14-061). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind: a test fails on the wrong prompt rather than
 * skipping it.
 */
import { expect } from 'vitest';
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import { act, decision, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { choices, donChoices, kind } from '../kit.ts';
import { need, settleOrders } from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const L14 = {
  /** OP03-022 Arlong: 5000, {Fish-Man}/{Arlong Pirates}/{East Blue}. Only a [DON!! x2][When Attacking]. */
  fish: 'OP03-022',
  /** OP14-040 Jinbe: 5000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}. Named [Jinbe]. Only an [Activate: Main]. */
  jinbe: 'OP14-040',
  /** OP11-021 Jinbe: 5000, {Fish-Man}/{Straw Hat Crew}. Named [Jinbe]. Only an [End of Your Turn]. */
  jinbe2: 'OP11-021',
  /** OP14-020 Dracule Mihawk: 5000, {The Seven Warlords of the Sea}. Named [Dracule Mihawk]. Only an [Activate: Main]. */
  mihawk: 'OP14-020',
  /** OP06-020 Hody Jones: 5000, {Fish-Man}. [Activate: Main] rest this Leader: rest up to 1 of the opponent's DON!! or Characters with cost 3 or less. */
  hody: 'OP06-020',
  /** OP11-022 Shirahoshi: 5000, {Merfolk}/{Fish-Man Island}. Cannot attack; only an [Activate: Main]. */
  merfolk: 'OP11-022',
  /** OP01-060 Donquixote Doflamingo: 5000, {Donquixote Pirates}. [DON!! x2][When Attacking] only. */
  dp: 'OP01-060',
  /** ST01-001 Monkey.D.Luffy: 5000, {Straw Hat Crew}. Vanilla. */
  luffy: 'ST01-001',
} as const;

/** Vanilla scenery Characters (no effect, no [Trigger]). */
export const C14 = {
  /** OP03-101 Camie: cost 1, 3000, Counter +1000, {Merfolk}. */
  camie: 'OP03-101',
  /** OP03-111 Charlotte Praline: cost 3, 5000, Counter +1000, {The Sun Pirates}/{Merfolk}. */
  praline: 'OP03-111',
  /** ST03-006 Jinbe: cost 2, 4000, Counter +1000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}. */
  jinbe2: 'ST03-006',
  /** OP03-007 Namule: cost 3, 5000, Counter +1000, {Fish-Man}/{Whitebeard Pirates}. */
  namule: 'OP03-007',
  /** OP07-027 Jinbe: cost 4, 6000, Counter +1000, {Fish-Man}/{The Sun Pirates}. */
  jinbe4: 'OP07-027',
  /** OP11-113 Ryuboshi: cost 5, 7000, Counter +1000, {Merfolk}/{Fish-Man Island}. */
  ryuboshi: 'OP11-113',
  /** OP17-051 Jinbe: cost 7, 8000, Counter +2000, {Fish-Man}/{Impel Down}/{The Sun Pirates}. */
  jinbe7: 'OP17-051',
  /** OP02-084 Blugori: cost 1, 3000, Counter +1000, {Animal}/{Impel Down}. */
  blugori: 'OP02-084',
  /** OP02-088 Sphinx: cost 4, 6000, Counter +1000, {Animal}/{Impel Down}. */
  sphinx: 'OP02-088',
  /** EB01-032 Army Wolves: cost 5, 7000, Counter +1000, {Animal}/{Impel Down}. */
  wolves: 'EB01-032',
  /** OP11-064 Saldeath: cost 6, 8000, Counter +1000, {Impel Down}. */
  saldeath: 'OP11-064',
  /** OP02-006 Kingdew: cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** EB01-005 Doma: cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. */
  doma: 'EB01-005',
  /** OP01-023 Marco: cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  marco: 'OP01-023',
  /** OP01-012 Sai: cost 2, 4000, Counter +1000, {Happosui Army}. */
  sai: 'OP01-012',
  /** OP01-018 Hajrudin: cost 4, 6000, Counter +1000, {Giant}/{New Giant Pirates}. */
  hajrudin: 'OP01-018',
  /** OP02-020 LittleOars Jr.: cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  littleOars: 'OP02-020',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, {Rocks Pirates}. */
  xebec: 'OP17-118',
  /** OP05-035 Bellamy: cost 3, 5000, Counter +1000, {Donquixote Pirates}. */
  bellamy: 'OP05-035',
  /** OP10-073 Buffalo: cost 4, 6000, Counter +1000, {Donquixote Pirates}. */
  buffalo: 'OP10-073',
  /** OP12-076 Monet: cost 5, 6000, Counter +2000, {Donquixote Pirates}/{Punk Hazard}. */
  monet: 'OP12-076',
} as const;

/** Scripted scenery. */
export const S14 = {
  /** OP03-044 Kaya: cost 1, 0 power. [On Play] Draw 2 cards and trash 2 cards from your hand. */
  kaya: 'OP03-044',
  /** OP09-077 Gum-Gum Lightning: Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
} as const;

/** One-line description of the pending decision, for scratch debugging. */
export function dbg(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  const legal = g
    .legal()
    .map((a) => JSON.stringify(a))
    .slice(0, 14);
  return `${d.kind}/${d.purpose} for ${d.player} max=${d.max}: ${d.prompt} | opts=${(d.options ?? []).map((o) => o.id + ':' + o.label)} | legal=${legal.join(' ')}`;
}

/** The DON!! summary of a player. */
export function donSum(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** Pick one of the pending cost `choose`'s card candidates (a card instance), strictly. */
export function restPick(g: TestGame, which: InstanceId): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  if (!choices(g).includes(which)) throw new Error(`cost candidate ${which} not offered`);
  act(g, { type: 'pick', choice: which });
}

/**
 * Answer the cost and target `choose` prompts of an effect in whichever order the engine asks them:
 * a pending cost pick takes `cost` (a card instance, or `'don'` for an active DON!! card), a pending
 * target pick takes `target` (`null` chooses nothing). Stops at the first decision of any other kind
 * or owner. Throws if a prompt needs an answer the caller did not give.
 */
export function settle(
  g: TestGame,
  o: { cost?: InstanceId | 'don'; target?: InstanceId | null },
  who: PlayerId = 'p1',
): void {
  for (let i = 0; i < 6; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== who) return;
    if (d.purpose === 'cost') {
      if (o.cost === undefined) return;
      if (o.cost === 'don') act(g, { type: 'pick', choice: { from: 'costActive' } });
      else act(g, { type: 'pick', choice: o.cost });
    } else if (d.purpose === 'target') {
      if (o.target === undefined) return;
      if (o.target === null) act(g, { type: 'done' });
      else act(g, { type: 'pick', choice: o.target });
    } else return;
  }
}

/**
 * A card is trashed from p1's hand by an effect: p1 plays OP16-093 Bartholomew Kuma
 * ([On Play] Draw 2 cards and trash 2 cards from your hand. Then, give up to 1 rested DON!! card to
 * your Leader or 1 of your Characters), trashes `cards` (two ids in hand after the draw), and gives
 * no DON!!. Kuma must be in p1's hand.
 */
export function trashByKuma(g: TestGame, cards: [CardId, CardId], who: PlayerId = 'p1'): void {
  const k = g.find(who, 'hand', 'OP16-093');
  // Kuma's first prompt offers hand cards only, so the play helper cannot mistake it for the cost.
  play(g, k);
  const picked = new Set<InstanceId>();
  for (const c of cards) {
    const hit = g.zone(who, 'hand').find((x) => x.card === c && !picked.has(x.instance));
    if (!hit) throw new Error(`${c} is not in hand`);
    picked.add(hit.instance);
  }
  need(g, 'choose', who);
  for (const i of [...picked].sort()) act(g, { type: 'pick', choice: i });
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'target' && d.player === who) {
    act(g, { type: 'done' });
  }
  // Several watchers of the same trash event are ordered by their owner (an `order` decision).
  settleOrders(g, who);
}

/** True when the pending cost `choose` offers DON!! classes. */
export function costOffersDon(g: TestGame): boolean {
  return kind(g) === 'choose' && donChoices(g).length > 0;
}
