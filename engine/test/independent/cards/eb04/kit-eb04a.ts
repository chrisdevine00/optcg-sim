/**
 * Helpers for the EB-04 group-A independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Every answer helper accepts ONE named kind of prompt and fails on anything else (see
 * kit-op17b.ts). Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { expect } from 'vitest';
import type { CardId, CardPlacement, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { BLUE, cardOf, choices, kind, LEAD, RED, side, theirTurn } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. Only an [Activate: Main] (or "cannot attack") unless noted. */
export const LE = {
  /** OP08-021 Carrot: Green, 5000, 5 Life, {Minks}. [Activate: Main] only. */
  minks: 'OP08-021',
  /** P-076 Sakazuki: Red, 5000, 4 Life, {Navy}. [Activate: Main] only. */
  navy: 'P-076',
  /** OP12-061 Donquixote Rosinante: 5000, 4 Life, {Donquixote Pirates}/{Navy}. Has a K.O. replacement only. */
  navyDress: 'OP12-061',
  /** OP01-031 Kouzuki Oden: Green, 5000, 5 Life, {Land of Wano}/{Kouzuki Clan}. [Activate: Main] only. */
  wano: 'OP01-031',
  /** OP06-020 Hody Jones: Green, 5000, 5 Life, {Fish-Man}/{New Fish-Man Pirates}. [Activate: Main] only. */
  fishMan: 'OP06-020',
  /** OP11-022 Shirahoshi: Green/Yellow, 5000, 5 Life, {Merfolk}/{Fish-Man Island}. Cannot attack. */
  merfolk: 'OP11-022',
  /** OP04-001 Nefeltari Vivi: Blue, 5000, 5 Life, {Alabasta}. Cannot attack; [Activate: Main] only. Named [Nefeltari Vivi]. */
  vivi: 'OP04-001',
  /** OP02-071 Magellan: Purple, 6000, 5 Life, {Impel Down}. Only a DON!!-return trigger. */
  magellan: 'OP02-071',
  /** OP12-001 Silvers Rayleigh: Red/Blue, 5000, 5 Life, {Former Roger Pirates}. [Activate: Main] only. Named [Silvers Rayleigh]. */
  rayleighLeader: 'OP12-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Neutral. */
  luffy: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. Neutral. */
  croc: 'ST03-001',
} as const;

/** Scenery Characters (all vanilla: no effect text, no [Trigger]) with the stats tests rely on. */
export const SN = {
  // Minks
  /** OP08-027 Tristan: Green, cost 1, 3000, Counter +1000, {Minks}. */
  tristan: 'OP08-027',
  /** OP08-035 BB: Green, cost 2, 4000, Counter +1000, {Minks}. */
  bb: 'OP08-035',
  /** ST07-014 Pekoms: Purple, cost 3, 5000, Counter +1000, {Minks}/{Big Mom Pirates}. */
  pekoms: 'ST07-014',
  /** OP12-032 Nekomamushi: Green, cost 6, 7000, Counter +2000, {Land of Wano}/{Minks}/{The Akazaya Nine}. */
  neko: 'OP12-032',
  // Neptunian
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, Counter +1000, {Neptunian}. */
  nept6: 'OP11-026',
  /** OP11-033 Bird Neptunian: Green, cost 6, 7000, Counter +2000, {Neptunian}. */
  nept7: 'OP11-033',
  /** OP13-010 Lord of the Coast: Red, cost 6, 8000, Counter +1000, {East Blue}/{Neptunian}. */
  nept8: 'OP13-010',
  // Navy
  /** ST06-003 Jango: Black, cost 1, 3000, Counter +1000, {Navy}. */
  jango1: 'ST06-003',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. */
  yamakaji: 'OP02-116',
  // Land of Wano
  /** OP01-043 Shinobu: Green, cost 3, 5000, Counter +1000, {Land of Wano}. */
  shinobu: 'OP01-043',
  // Fish-Man
  /** OP16-023 Arlong: Green, cost 1, 3000, Counter +1000, {Fish-Man}/{The Sun Pirates}/{Impel Down}. */
  arlong1: 'OP16-023',
  /** OP07-027 Jinbe: Green, cost 4, 6000, Counter +1000, {Fish-Man}/{The Sun Pirates}. */
  jinbe4: 'OP07-027',
  /** OP15-030 Hyouzou: Green, cost 5, 6000, Counter +2000, {Merfolk}/{Fish-Man Island}. Not {Fish-Man}. */
  hyouzou: 'OP15-030',
  // Alabasta
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000, {Animal}/{Alabasta}. */
  karoo1: 'ST01-003',
  /** ST01-009 Nefeltari Vivi: Red, cost 2, 4000, Counter +1000, {Alabasta}. Named [Nefeltari Vivi]. */
  viviChar: 'ST01-009',
  /** OP13-011 Nefeltari Cobra: Red, cost 5, 6000, Counter +2000, {Alabasta}. */
  cobra5: 'OP13-011',
  /** OP14-030 Chaka & Pell: Red, cost 6, 7000, Counter +2000, {Alabasta}. */
  chaka6: 'OP14-030',
  /** EB04-023 Chaka & Pell: cost 8, 9000, {Alabasta}, [Double Attack]; [On Play] is optional (a Leader debuff). */
  chaka8: 'EB04-023',
  // Neutral by cost / power
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** OP05-044 John Giant: Blue, cost 8, 10000, Counter +1000, {Giant}/{Navy}. */
  c8: 'OP05-044',
  /** P-041 Monkey.D.Luffy: Blue, cost 10, 12000, Counter +1000. */
  c10: 'P-041',
  // Green Characters for Jinbe
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  green5: 'OP02-039',
  /** OP04-023 Kuro: Green, cost 6, 8000, Counter +1000, {East Blue}/{Black Cat Pirates}. */
  green6: 'OP04-023',
  /** OP17-035 Roronoa Zoro: Green, cost 7, 8000, Counter +2000, {East Blue}/{Straw Hat Crew}. */
  green7: 'OP17-035',
  /** OP03-023 Alvida: Green, cost 1, 3000, Counter +1000, {East Blue}/{Alvida Pirates}. */
  green1: 'OP03-023',
  // [Trigger] Characters (no [On Play], no static effect)
  /** OP01-104 Speed: Purple, cost 2, 3000, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP03-100 Kingbaum: Yellow, cost 3, 5000, no Counter, has a [Trigger] (no [On Play]). */
  kingbaum: 'OP03-100',
  /** OP07-113 Roronoa Zoro: Yellow, cost 5, 6000, Counter +1000, has a [Trigger]; effectText is empty. */
  zoroTrig: 'OP07-113',
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker] (its [On Play] needs a play). */
  blocker: 'OP09-072',
  /** OP08-118 Silvers Rayleigh: Red, cost 8, 8000, no Counter, {Former Roger Pirates}. Only an [On Play]. */
  rayleigh: 'OP08-118',
} as const;

/** EB04 cards under test used as scenery for each other. */
export const E4 = {
  luluciaStage: 'EB04-010',
  moda: 'EB04-006',
  scaled: 'EB04-011',
  bird: 'EB04-016',
  carrot: 'EB04-013',
  mystoms: 'EB04-017',
  law: 'EB04-005',
  smoker: 'EB04-003',
  zeff: 'EB04-004',
  jinbe: 'EB04-015',
  megalo: 'EB04-018',
  igaram: 'EB04-021',
  hancock: 'EB04-027',
} as const;

/** Instance of `card` in `who`'s `zone` (first copy unless `nth`). */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** True when the pending decision is a `choose` that offers this instance. */
export function offers(g: TestGame, i: InstanceId): boolean {
  return kind(g) === 'choose' && choices(g).includes(i);
}

/** Pick exactly this one instance of the pending `choose` (strict: fails if it is not offered). */
export function pickOne1(g: TestGame, i: InstanceId): void {
  need(g, 'choose');
  expect(choices(g), 'target offered').toContain(i);
  act(g, { type: 'pick', choice: i });
}

/** Current cost of an instance. */
export function costOf(g: TestGame, i: InstanceId): number | null {
  return g.card(i).cost;
}

/** Card id of an instance, for messages. */
export { cardOf };

/** Rest state of an instance. */
export function rested(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** Decision kind and owner, for failure messages. */
export function pending(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.kind}/${d.player}/${d.purpose}: ${d.prompt}` : 'none';
}

/** Instances of a zone with this card id. */
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

/** Like `theirs`, but the Leader may be a placement (rested, DON!! given). */
export function theirsP(
  leader: string | CardPlacement,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    { ...side('ST01-001', BLUE, { costArea: { active: 0, rested: 0 }, ...spec }), leader },
    side(LEAD.luffy, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** p2 attacks p1's Leader with p2's Leader or a named Character, in a `theirs` game. */
export function p2attacks(g: TestGame, attackerCard?: CardId, target?: InstanceId): void {
  const attacker = attackerCard ? g.find('p2', 'characters', attackerCard) : g.leader('p2');
  act(g, { type: 'attack', attacker, target: target ?? g.leader('p1') });
}
