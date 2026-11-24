/**
 * Helpers for the OP-13 group-B independent card tests (OP13-032 .. OP13-058). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). `unusable` / `none` / `skipEmpty` are kept out of the
 * paths where a test asserts whether a prompt appears: those tests use raw `g.act`.
 */
import { expect } from 'vitest';
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donOf } from '../kit.ts';
import { need, pickInst } from '../op15/kit-op15a.ts';

export * from '../op15/kit-op15a.ts';
export { result, turn } from '../../helpers.ts';

/** Leaders used as scenery. */
export const WL = {
  /** OP16-001 Portgas.D.Ace: Red, 5000, 5 Life, {Whitebeard Pirates}. [Activate: Main] only. */
  ace: 'OP16-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, 4 Life, {Heart Pirates}/{Supernovas}. [Activate: Main] only. */
  law: 'OP01-002',
  /** OP07-038 Boa Hancock: Blue, 5000, 5 Life, named [Boa Hancock]; only a [Your Turn] [Once Per Turn] reaction to its own removals. */
  hancock: 'OP07-038',
  /** OP14-041 Boa Hancock: Blue/Yellow (multicoloured), 5000, 4 Life, named [Boa Hancock]. */
  hancockMulti: 'OP14-041',
} as const;

/** Characters used as scenery, with the stats the tests rely on (all effect-free, no [Trigger]). */
export const WV = {
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP03-006 Speed Jil: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. */
  jil: 'OP03-006',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  marco: 'OP01-023',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  oars: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. */
  shiki: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter, [On Play] only, {Seven Warlords}. */
  mihawk: 'OP01-070',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. */
  sai: 'OP01-012',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  komachiyo: 'OP01-010',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** EB01-005 Doma: Red, cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. */
  doma: 'EB01-005',
  /** OP16-016 Ramba: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates Allies}. */
  ramba: 'OP16-016',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}; [DON!! x1] effect only. */
  whitey: 'OP02-014',
  /** OP03-023 Alvida: Green, cost 1, 3000, Counter +1000, {East Blue}/{Alvida Pirates}. */
  alvida: 'OP03-023',
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000. */
  karoo: 'ST01-003',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  sunny: 'P-015',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000, {Alabasta}; buffs only {Alabasta}. */
  cobra: 'OP04-012',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP01-009 Carrot: Red, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  carrot: 'OP01-009',
} as const;

/** Boa Hancock Characters (named [Boa Hancock]) without an [On Play]: costs 3, 4 and 6; plus a cost-7 one. */
export const HANCOCK = {
  /** OP13-051 Boa Hancock: cost 3, 5000, [On K.O.] only (the card under test elsewhere). */
  c3: 'OP13-051',
  /** ST03-013 Boa Hancock: cost 3, 1000, Counter +1000, [Blocker], has a [Trigger]. */
  c3b: 'ST03-013',
  /** OP01-078 Boa Hancock: cost 4, 5000, Counter +1000, [Blocker]. */
  c4: 'OP01-078',
  /** OP16-112 Boa Hancock: cost 6, 8000, Counter +1000, vanilla (yellow). */
  c6: 'OP16-112',
  /** OP16-032 Boa Hancock: cost 7, 9000, [Unblockable], [On Play] (never played in these tests). */
  c7: 'OP16-032',
} as const;

/** DON!! counts of `who`: active, rested (cost area) and given. */
export function dons(g: TestGame, who: PlayerId = 'p1') {
  return donOf(g, who);
}

/** Labels of the pending decision's named options (a mode or a count pick). */
export function optionLabels(g: TestGame): string[] {
  return (decision(g)?.options ?? []).map((o) => o.label);
}

/** Pick the named option whose label is `label` in the pending `choose`. */
export function pickOption(g: TestGame, label: string): void {
  need(g, 'choose');
  const o = decision(g)?.options?.find((x) => x.label === label);
  if (!o) throw new Error(`No option "${label}"; offered ${optionLabels(g)}`);
  act(g, { type: 'pick', choice: { option: o.id } });
}

/** The pending decision must be a `choose` that offers `inst`; picks it (then done when asked). */
export function pickOffered(g: TestGame, inst: InstanceId): void {
  need(g, 'choose');
  expect(choices(g)).toContain(inst);
  pickInst(g, [inst]);
}

/** True when the game waits for the Main Phase action of `who` and nothing else. */
export function isMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** Cards in hand of `who`, as card ids, sorted. */
export function handOf(g: TestGame, who: PlayerId = 'p1'): CardId[] {
  return g
    .zone(who, 'hand')
    .map((c) => c.card)
    .sort();
}

/** Total Life cards of `who`. */
export function lifeN(g: TestGame, who: PlayerId = 'p1'): number {
  return queries.zone(g.state, who, 'life').length;
}

/** Decline a pending "use this effect?" and nothing else. */
export function declineUse(g: TestGame): void {
  need(g, 'optional');
  act(g, { type: 'optional', accept: false });
}
