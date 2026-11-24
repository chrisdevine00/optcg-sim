/**
 * Helpers for the engine-wave-4 group-A independent card tests (OP15-001 .. OP15-116, OP13-046,
 * OP14-051). Public API, frozen fixtures and the earlier kits only. Every answer helper accepts ONE
 * named kind of prompt and fails on anything else (see kit-op17b.ts); where a test asks whether a
 * prompt appears it uses raw `g.act` / `decision`. Scenery stats are noted next to each constant;
 * tests repeat the ones they rely on.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { queries } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { BLUE, need, RED, side, theirTurn } from '../op14/kit-op14a.ts';

export * from '../op14/kit-op14a.ts';

/** Scenery used by this group. Types matter for OP15-001 ({East Blue}). */
export const W4 = {
  /** OP03-023 Alvida: Green, cost 1, 3000, {East Blue}/{Alvida Pirates}. Vanilla. */
  alvida: 'OP03-023',
  /** OP03-046 Genzo: Blue, cost 2, 4000, {East Blue}. Vanilla. */
  genzo: 'OP03-046',
  /** OP12-067 Carmen: Purple, cost 3, 5000, {East Blue}. Vanilla. */
  carmen: 'OP12-067',
  /** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}/{East Blue}. Vanilla. */
  tashigi: 'EB05-015',
  /** OP04-023 Kuro: Green, cost 6, 8000, {East Blue}/{Black Cat Pirates}. Vanilla. */
  kuro6: 'OP04-023',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. No type. Vanilla. */
  komachiyo: 'OP01-010',
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  karoo: 'ST01-003',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. Vanilla. */
  oars: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  shiki8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter. [On Play] only. */
  mihawk9: 'OP01-070',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}. Vanilla. */
  whiteyBay: 'OP02-014',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla. */
  mohjiBlue: 'OP02-060',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Vanilla. */
  cobra: 'OP04-012',
  /** OP01-104 Speed: Purple Character, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** ST05-001 Shanks: Purple Leader, 5000, 5 Life, {FILM}/{Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'ST05-001',
  /** ST01-001 Monkey.D.Luffy: Red Leader, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  luffy: 'ST01-001',
} as const;

/** p2's Main Phase (turn 4) with p1 defending; p1 has no DON!!, p2 has 10 active DON!!. */
export function theirsW(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader: string = W4.luffy,
): TestGame {
  return theirTurn(
    side(W4.luffy, BLUE, { costArea: { active: 0, rested: 0 }, ...p1 }),
    side(p2Leader, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** DON!! counts of a player: deck, active, rested, given. */
export function donW(g: TestGame, who: PlayerId) {
  return queries.don(g.state, who);
}

/** DON!! given to one card. */
export function givenTo(g: TestGame, i: InstanceId): number {
  return g.card(i).don;
}

/** Answer a pending "how many DON!!" count question (a `choose` of purpose `mode`) with `n`. */
export function giveCount(g: TestGame, n: number): void {
  const d = need(g, 'choose');
  if (d.purpose !== 'mode') throw new Error(`Expected a count question, got ${d.purpose}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** The largest count the pending count question offers. */
export function maxCount(g: TestGame): number {
  const d = need(g, 'choose');
  if (d.purpose !== 'mode') throw new Error(`Expected a count question, got ${d.purpose}`);
  return Math.max(...(d.options ?? []).map((o) => Number(o.id)));
}

/** True when the pending decision is a count question. */
export function asksCount(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.purpose === 'mode';
}

/** Instance of the nth Leader of `who`. */
export function ld(g: TestGame, who: PlayerId): InstanceId {
  return g.leader(who);
}
