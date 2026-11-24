/**
 * Helpers for the OP-11 group-A independent card tests (OP11-001 .. OP11-036). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. */
export const L11 = {
  /** OP11-001 Koby: Red/Black, 5000, 4 Life, {Navy}/{SWORD}. */
  koby: 'OP11-001',
  /** OP11-021 Jinbe: Green, 5000, 5 Life, {Fish-Man}/{Straw Hat Crew}. Only an [End of Your Turn]. */
  jinbe: 'OP11-021',
  /** OP11-022 Shirahoshi: Green/Yellow, 5000, 5 Life, {Merfolk}/{Fish-Man Island}. Cannot attack. */
  shirahoshi: 'OP11-022',
  /** OP02-093 Smoker: Black, 5000, 5 Life, {Navy}. Only a [DON!! x1][Activate: Main]. */
  navyLeader: 'OP02-093',
  /** OP03-022 Arlong: Green/Yellow, 5000, 5 Life, {Fish-Man}/{Arlong Pirates}/{East Blue}. Only a [DON!! x2][When Attacking]. */
  fishLeader: 'OP03-022',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Not Navy, not Fish-Man. */
  luffy: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. */
  kid: 'ST02-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. */
  croc: 'ST03-001',
} as const;

/** Vanilla scenery Characters of the OP-11 families. */
export const N11 = {
  /** OP02-097 Komille: Black, cost 1, 3000, {Navy}. */
  navy1: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, {Navy}. */
  navy2: 'OP02-107',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, {Navy}. */
  navy3: 'OP02-116',
  /** ST06-011 Momonga: Black, cost 4, 6000, {Navy}. */
  navy4: 'ST06-011',
  /** ST08-010 Monkey.D.Garp: Black, cost 5, 7000, {Navy}. */
  navy5: 'ST08-010',
  /** OP11-094 Morgan: Black, cost 6, 8000, {Navy}. */
  navy6: 'OP11-094',
  /** OP11-017 X.Drake: Red, cost 6, 7000, {Drake Pirates}/{Navy}/{SWORD}. Vanilla. */
  sword6: 'OP11-017',
  /** ST02-006 Koby: Green, cost 4, 6000, {Navy}. */
  navyKoby: 'ST02-006',
  /** ST03-006 Jinbe: Blue, cost 2, 4000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}. */
  fish2: 'ST03-006',
  /** OP03-007 Namule: Red, cost 3, 5000, {Fish-Man}/{Whitebeard Pirates}. */
  fish3: 'OP03-007',
  /** OP07-027 Jinbe: Green, cost 4, 6000, {Fish-Man}/{The Sun Pirates}. */
  fish4: 'OP07-027',
  /** OP12-023 Kawamatsu: Green, cost 5, 6000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}. */
  fish5: 'OP12-023',
  /** OP13-029 Jinbe: Green, cost 6, 7000, {FILM}/{Fish-Man}/{Straw Hat Crew}. */
  fish6: 'OP13-029',
  /** OP09-067 Jinbe: Purple, cost 7, 9000, {Fish-Man}/{Straw Hat Crew}. */
  fish7: 'OP09-067',
  /** OP03-101 Camie: Yellow, cost 1, 3000, {Merfolk}. */
  merfolk1: 'OP03-101',
  /** OP03-111 Charlotte Praline: Yellow, cost 3, 5000, {The Sun Pirates}/{Merfolk}. */
  merfolk3: 'OP03-111',
  /** OP11-113 Ryuboshi: Yellow, cost 5, 7000, {Merfolk}/{Fish-Man Island}. */
  merfolk5: 'OP11-113',
  /** OP11-111 Mamboshi: Yellow, cost 6, 7000, {Merfolk}/{Fish-Man Island}. */
  merfolk6: 'OP11-111',
  /** OP11-033 Bird Neptunian: Green, cost 6, 7000, {Neptunian}. */
  nept6: 'OP11-033',
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, {Neptunian}. */
  nept6b: 'OP11-026',
  /** OP11-112 Megalo: Yellow, cost 3, 2000, {Animal}/{Fish-Man Island}, [Blocker]. */
  megalo: 'OP11-112',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, {Mountain Bandits}. Inert alone. */
  dadan: 'OP13-009',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, {Alabasta}. Inert alone. */
  cobra: 'OP04-012',
  /** OP14-005 Killer: Red, cost 1, 1000, {Kid Pirates}/{Supernovas}. Only an own [Activate: Main]. */
  killer1: 'OP14-005',
  /** OP01-039 Killer: Green, cost 2, 2000, {Kid Pirates}/{Supernovas}. [Blocker]. */
  blocker2: 'OP01-039',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  oars: 'OP02-020',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  komachiyo: 'OP01-010',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, {Whitebeard Pirates Allies}. [DON!! x1] attacks active Characters. */
  whitey: 'OP02-014',
} as const;

/** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 Character; then Life is trashed to 1. */
export const KC = 'EB01-059';

/** Card ids of a zone, sorted. */
export function ids(g: TestGame, who: PlayerId, zone: Parameters<TestGame['zone']>[1]): CardId[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/**
 * The pending `choose` offers nothing (an empty "up to" pick the engine still asks): end it.
 * Fails if it offers a candidate or is not a `choose`.
 */
export function endEmpty(g: TestGame): void {
  need(g, 'choose');
  expect(choices(g)).toEqual([]);
  expect(canFinish(g)).toBe(true);
  act(g, { type: 'done' });
}

/** If a `choose` that offers nothing is pending, end it; otherwise do nothing. */
export function endEmptyIfAsked(g: TestGame): void {
  const d = decision(g);
  if (d?.kind === 'choose' && choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
}

/** Is the instance still on `who`'s Character area? */
export function onField(g: TestGame, who: PlayerId, i: InstanceId): boolean {
  return g.zone(who, 'characters').some((c) => c.instance === i);
}

/** p1 declares an attack with `attacker` on `target`; the defender passes block and Counter. */
export function hitAndPass(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  act(g, { type: 'attack', attacker, target });
}

/**
 * Pay the "trash a card" / "rest a DON!!" steps of `who` (a "you may" question is accepted first):
 * a card in `hand` is picked when offered, an active DON!! class otherwise. These steps may be
 * modelled as costs or as effect steps, so the prompt purpose is not checked. Stops at the first
 * prompt that offers neither (the next step of the effect), leaving it pending.
 */
export function payCosts(g: TestGame, hand: InstanceId[] = [], who: PlayerId = 'p1'): void {
  const wanted = new Set(hand);
  for (let i = 0; i < 10; i++) {
    const d = decision(g);
    if (!d || d.player !== who) return;
    if (d.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept)) {
      act(g, { type: 'optional', accept: true });
    } else if (d.kind === 'choose') {
      const card = choices(g).find((c) => wanted.has(c));
      if (card) {
        wanted.delete(card);
        act(g, { type: 'pick', choice: card });
        continue;
      }
      const don = donChoices(g).find((o) => o.from === 'costActive');
      if (don) {
        act(g, { type: 'pick', choice: don });
        continue;
      }
      return;
    } else return;
  }
}
