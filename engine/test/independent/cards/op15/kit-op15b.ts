/**
 * Helpers for the OP-15 group-B independent card tests (OP15-047 to OP15-083). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind (`yes` / `no` need an `optional`, `payHand`
 * needs a cost `choose`, ...): a test fails on the wrong prompt rather than skipping it.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { queries } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LD15 = {
  /** OP15-002 Lucy: Blue/Red, 5000, 4 Life, {Revolutionary Army}/{Dressrosa}. Fires only on attack. */
  lucy: 'OP15-002',
  /** EB01-040 Kyros: 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dressrosa: 'EB01-040',
  /** ST09-001 Yamato: 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST01-001 Monkey.D.Luffy: 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  shc: 'ST01-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{Red-Haired Pirates}. [Activate: Main] only. */
  purple: 'ST05-001',
  /** OP06-080 Gecko Moria: Black, 5000, 5 Life, {Thriller Bark Pirates}. Only a [DON!! x1][When Attacking]. */
  moria: 'OP06-080',
} as const;

/** Vanilla (or inert) scenery Characters with the stats the tests rely on. */
export const SC15 = {
  /** OP01-076 Bellamy: Blue, cost 2, 4000, Counter +1000, {Dressrosa}, vanilla. */
  bellamy: 'OP01-076',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, Counter +1000, {Dressrosa}, vanilla. */
  gilly: 'OP10-054',
  /** OP10-045 Cavendish: Blue, cost 4, 6000, no Counter, {Beautiful Pirates}/{Dressrosa}; only a [When Attacking]. */
  cavendish: 'OP10-045',
  /** OP15-049 Hajrudin: Blue, cost 5, 6000, Counter +2000, {Giant}/{Dressrosa}/{New Giant Pirates}, vanilla. */
  hajrudin: 'OP15-049',
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}, vanilla. */
  lola: 'OP06-094',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}/{Seven Warlords}, vanilla. */
  moria: 'OP02-054',
  /** OP05-110 Holly: Yellow, cost 3, 5000, Counter +1000, {Animal}/{Sky Island}, vanilla. */
  holly: 'OP05-110',
  /** OP05-108 Nola: Yellow, cost 5, 7000, Counter +1000, {Animal}/{Sky Island}, vanilla. */
  nola: 'OP05-108',
} as const;

/** The number of DON!! cards on a player's field (cost area plus given). */
export function donOnField(g: TestGame, who: PlayerId = 'p1'): number {
  const d = queries.don(g.state, who);
  return d.active + d.rested + d.given;
}

/** The DON!! deck size of a player. */
export function donDeckSize(g: TestGame, who: PlayerId = 'p1'): number {
  return queries.don(g.state, who).deck;
}

/** Keywords of an instance. */
export function kws(g: TestGame, i: InstanceId): string[] {
  return g.card(i).keywords;
}

/** Play `card` from the deciding player's hand with a raw action and leave its first prompt pending. */
export function playRaw(g: TestGame, card: CardId): InstanceId {
  const who = g.decider;
  const i = g.find(who, 'hand', card);
  act(g, { type: 'playCard', card: i });
  return i;
}

/**
 * Answer a pending "choose one" (a `choose` with purpose `mode`) with the option whose label matches
 * `label`. Throws if no option matches, or if the pending decision is anything else.
 */
export function pickMode(g: TestGame, label: RegExp, who: PlayerId = 'p1'): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'mode') {
    throw new Error(
      `Expected a mode choice for ${who}, got ${d?.kind}/${d?.purpose}: ${d?.prompt}`,
    );
  }
  const hit = (d.options ?? []).find((o) => label.test(o.label));
  if (!hit) throw new Error(`No option matches ${label}: ${(d.options ?? []).map((o) => o.label)}`);
  act(g, { type: 'pick', choice: { option: hit.id } });
}

/** The labels of the pending mode choice. */
export function modeLabels(g: TestGame): string[] {
  const d = decision(g);
  return d?.kind === 'choose' && d.purpose === 'mode' ? (d.options ?? []).map((o) => o.label) : [];
}

/** The pending decision's kind, or throw if none. */
export function pendingKind(g: TestGame): string {
  const d = decision(g);
  if (!d) throw new Error('no decision');
  return d.kind;
}
