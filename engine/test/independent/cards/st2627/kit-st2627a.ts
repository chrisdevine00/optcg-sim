/**
 * Helpers for the ST-26 / ST-27 independent card tests (ST26-001 .. ST26-005, ST27-001 ..
 * ST27-005). Public API, frozen fixtures and the earlier kits only. Every answer helper accepts
 * ONE named kind of prompt and fails on anything else (see kit-op17b.ts).
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision, passBlock, passCounter } from '../../helpers.ts';
import { canFinish, choices, donChoices, donOf, kind } from '../kit.ts';
import { need, unusable } from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16a.ts';
export { donOf, donChoices };

/** Leaders used as scenery. */
export const SL = {
  /** OP16-022 Monkey.D.Luffy: Blue/Green (multicolored), 5000, 4 Life, {Straw Hat Crew}/{Impel Down}. [Activate: Main] only. */
  multiShc: 'OP16-022',
  /** ST10-002 Monkey.D.Luffy: Purple/Red (multicolored), 6000, 3 Life, {Straw Hat Crew}. [Activate: Main] only. */
  multiShc6: 'ST10-002',
  /** ST01-001 Monkey.D.Luffy: Red (one color), 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  monoShc: 'ST01-001',
  /** OP16-080 Marshall.D.Teach: Black/Yellow (multicolored), 5000, 4 Life, {Blackbeard Pirates}. [Opponent's Turn] own Characters +1 cost; [On your Opponent's Attack] may trash a [Trigger] card. */
  bbp: 'OP16-080',
  /** ST05-001 Shanks: Purple, 5000, 5 Life. Not {Blackbeard Pirates}, not {Straw Hat Crew}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** OP17-039 Rocks.D.Xebec: Blue, 5000, 5 Life, used by the opponent. */
  rocks: 'OP17-039',
} as const;

/** Scenery cards with the stats the tests rely on (repeated where a test depends on them). */
export const SS = {
  /** OP05-065 San-Gorou: Purple, cost 6, 8000, vanilla, {Straw Hat Crew}. */
  sangorou8: 'OP05-065',
  /** ST18-003 San-Gorou: Purple, cost 5, 6000, [When Attacking] only, {Straw Hat Crew}. */
  sangorou6: 'ST18-003',
  /** OP09-065 Sanji: Purple, cost 7, 7000, [On Play] only (inert when placed), {Straw Hat Crew}. */
  sanji7: 'OP09-065',
  /** OP09-105 Sanji: Yellow, cost 5, 6000, vanilla, {Straw Hat Crew}/{Egghead}. */
  sanji6: 'OP09-105',
  /** OP16-086 Sanji: Black, cost 8, 9000, vanilla, {Land of Wano}/{Straw Hat Crew}. */
  sanji9: 'OP16-086',
  /** OP02-007 Thatch: Red, cost 6, 8000, vanilla. Not named Sanji or San-Gorou. */
  thatch8: 'OP02-007',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000. */
  c5: 'OP02-006',
  /** ST01-010 Franky: Red, cost 4, 6000, vanilla, {Straw Hat Crew}. */
  franky: 'ST01-010',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, vanilla. Used as a strong attacker. */
  oars9: 'OP02-020',
  /** OP09-082 Avalo Pizarro: Black, cost 4, 6000, vanilla, {Blackbeard Pirates}. */
  bbp4: 'OP09-082',
  /** OP10-084 Sanjuan.Wolf: Black, cost 5, 7000, vanilla, {Blackbeard Pirates}/{Giant}. */
  bbp5: 'OP10-084',
  /** OP09-094 Peachbeard: Black, cost 3, 5000, vanilla, {Peachbeard Pirates}/{Blackbeard Pirates Allies}. */
  allies3: 'OP09-094',
  /** OP03-082 Kumadori: Black, cost 4, 6000, vanilla, {CP9}. */
  black4: 'OP03-082',
  /** OP16-102 Avalo Pizarro: Yellow, cost 1, 2000, {Blackbeard Pirates}: a card of the type that is not black. */
  yellowBbp: 'OP16-102',
  /** OP09-096 My Era...Begins!!: Black Event, cost 1. */
  blackEvent: 'OP09-096',
  /** OP09-099 Fullalead: Black Stage, cost 1, {Blackbeard Pirates}. Has its own [Activate: Main]. */
  fullaleadBlack: 'OP09-099',
  /** OP17-057 Fullalead: Blue Stage, cost 1, {Rocks Pirates}. Only an [On Your Opponent's Attack]. */
  fullaleadBlue: 'OP17-057',
} as const;

/** Black card ids used by the ST-27 tests. */
export const ST27 = {
  pizarro: 'ST27-001',
  devon: 'ST27-002',
  kuzan: 'ST27-003',
  wolf: 'ST27-004',
  teach: 'ST27-005',
} as const;

/** The nth card of `who` in `zone` as an instance. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** Current cost of the nth copy of `card` in `who`'s `zone`. */
export function costIn(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): number | null {
  return g.card(g.find(who, zone, card, nth)).cost;
}

/** True when the game waits for `who`'s plain Main Phase action. */
export function waitingAtMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** True if the Main Phase offers a `playCard` for this hand instance. */
export function canPlay(g: TestGame, card: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'playCard' && a.card === card);
}

/**
 * Pay a pending "DON!! −N" cost (a `choose` with purpose cost): pick N DON!! of class `from` when
 * the engine asks. If the engine pays by itself (one class only) nothing is asked and nothing is
 * done. Throws on any other prompt kind.
 */
export function payDonCost(
  g: TestGame,
  n: number,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  for (let i = 0; i < n; i++) {
    if (kind(g) !== 'choose') return;
    const d = decision(g);
    if (d?.purpose !== 'cost') return;
    const want = donChoices(g).find((o) => o.from === from) ?? donChoices(g)[0];
    if (!want) throw new Error('A cost choose offered no DON!! to pick');
    act(g, { type: 'pick', choice: want });
  }
}

/** Accept the pending "pay DON!! −N" question and pay with DON!! of class `from`. */
export function useDonCost(
  g: TestGame,
  n: number,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  need(g, 'optional');
  act(g, { type: 'optional', accept: true });
  payDonCost(g, n, from);
}

/** True if the pending decision is the optional "pay DON!!" question and accepting is legal. */
export function costOffered(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return (
    d?.kind === 'optional' &&
    d.player === who &&
    g.legal().some((a) => a.type === 'optional' && a.accept)
  );
}

/** An "up to" `choose` with no candidates: it is either not asked, or asked empty and ended with done. */
export function skipEmpty(g: TestGame): void {
  if (kind(g) !== 'choose') return;
  expect(choices(g)).toHaveLength(0);
  expect(donChoices(g)).toHaveLength(0);
  if (!canFinish(g)) throw new Error('An empty choose must allow done');
  act(g, { type: 'done' });
}

/** Pick one DON!! class (`from`) in the pending target `choose`. */
export function pickDonClass(g: TestGame, from: 'costActive' | 'costRested'): void {
  need(g, 'choose');
  const want = donChoices(g).find((o) => o.from === from);
  if (!want) throw new Error(`No ${from} DON!! offered; offered ${JSON.stringify(donChoices(g))}`);
  act(g, { type: 'pick', choice: want });
  if (kind(g) === 'choose' && canFinish(g) && choices(g).length === 0) act(g, { type: 'done' });
}

/** Option ids (a count prompt such as "add up to 1 DON!!") of the pending `choose`, in offered order. */
export function optionIds(g: TestGame): string[] {
  if (kind(g) !== 'choose') return [];
  return g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice
        ? [a.choice.option]
        : [],
    );
}

/** Answer the pending count prompt (a `choose` of named options) with option `id`. */
export function pickOption(g: TestGame, id: string): void {
  need(g, 'choose');
  if (!optionIds(g).includes(id)) throw new Error(`Option ${id} not offered: ${optionIds(g)}`);
  act(g, { type: 'pick', choice: { option: id } });
}

/** Total DON!! of `who` on the field (cost area plus given). */
export function fieldDon(g: TestGame, who: PlayerId): number {
  const d = donOf(g, who);
  return d.active + d.rested + d.given;
}

/**
 * The opponent (p2) attacks `target` with `attacker` and the defender (p1) does nothing: any
 * unusable "you may" question of p1 is declined, the block and counter steps are passed.
 */
export function defendNothing(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  attack(g, attacker, target);
  unusable(g, 'p1');
  passBlock(g);
  passCounter(g);
}
