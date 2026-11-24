/**
 * Helpers for the OP-11 group-C independent card tests (OP11-072 .. OP11-119, 30 cards). Public
 * API, frozen fixtures and the earlier kits only. Answer helpers accept ONE named kind of prompt
 * and fail on anything else, so a missing or extra "up to" / "you may" prompt is caught. Where a
 * test asserts whether a prompt appears, it uses raw `g.act` / `kind(g)`.
 */
import {
  queries,
  type CardId,
  type CardPlacement,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind, RED, side, myTurn, theirTurn } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';
import { BLUE } from '../m4b/kit-a.ts';

export * from '../op15/kit-op15a.ts';
export { result } from '../../helpers.ts';

/** Leaders used as scenery. */
export const LD11 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla: matches no type test. */
  plain: 'ST01-001',
  /** OP02-093 Smoker: Black, 5000, 5 Life, {Navy}. Only a [DON!! x1][Activate: Main]. */
  navy: 'OP02-093',
  /** OP02-071 Magellan: Purple, 6000, 5 Life, {Impel Down}. Only a [Your Turn] power effect on DON!! returns. */
  impelDown: 'OP02-071',
  /** EB05-010 Nico Robin: Green/Yellow, 5000, 4 Life, named [Nico Robin]. Only a Character K.O. watcher. */
  robin: 'EB05-010',
  /** OP11-022 Shirahoshi: Green/Yellow, 5000, 5 Life, named [Shirahoshi], {Merfolk}/{Fish-Man Island}. Cannot attack. */
  shirahoshi: 'OP11-022',
  /** OP11-062 Charlotte Katakuri: Purple, 5000, 5 Life, {Big Mom Pirates}. */
  katakuri: 'OP11-062',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  katakuriY: 'OP03-099',
  /** OP01-060 Donquixote Doflamingo: Blue, 5000, 5 Life, {Donquixote Pirates}. Leader colors include blue. */
  blueLeader: 'OP01-060',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. Leader colors include blue. */
  blue: 'ST03-001',
} as const;

/** Scenery Characters. Stats are repeated where a test depends on them. */
export const SC11 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000. */
  r1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000. */
  r2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000. */
  r3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000. */
  r4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000. */
  r5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000. */
  r6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000. */
  r7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000. */
  r8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000. [On Play] only: inert on the field. */
  c9: 'OP01-070',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, {Rocks Pirates}. */
  c10: 'OP17-118',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}. Vanilla. */
  navyB1: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}. Vanilla. */
  navyB2: 'OP02-107',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. Vanilla. */
  navyB3: 'OP02-116',
  /** OP02-109 Jaguar.D.Saul: Black, cost 4, 6000, Counter +1000, {Giant}/{Navy}. Vanilla. */
  navyB4: 'OP02-109',
  /** OP11-093 Bogard: Black, cost 6, 7000, Counter +2000, {Navy}. Vanilla. */
  navyB6: 'OP11-093',
  /** OP12-082 Issho: Black, cost 8, 10000, Counter +1000, {Navy}/{Dressrosa}. Vanilla. */
  navyB8: 'OP12-082',
  /** ST02-006 Koby: Green, cost 4, 6000, Counter +1000, {Navy}. Vanilla. */
  navyG4: 'ST02-006',
  /** EB05-015 Tashigi: Green, cost 5, 7000, Counter +1000, {Navy}/{East Blue}. Vanilla. */
  navyG5: 'EB05-015',
  /** OP06-049 Sengoku: Blue, cost 5, 7000, Counter +1000, {Navy}. Vanilla. */
  navyU5: 'OP06-049',
  /** OP02-077 Solitaire: Purple, cost 3, 5000, {Animal Kingdom Pirates}/{SMILE}. Vanilla. */
  smile3: 'OP02-077',
  /** OP02-080 Dobon: Purple, cost 2, 4000, {Animal Kingdom Pirates}/{SMILE}. Vanilla. */
  smile2: 'OP02-080',
  /** OP01-107 Babanuki: Purple, cost 5, 7000, {Animal Kingdom Pirates}/{SMILE}. Vanilla. */
  smile5: 'OP01-107',
  /** OP12-092 Mizerka: Black, cost 6, 7000, {Animal Kingdom Pirates}/{SMILE}. Vanilla. */
  smile6: 'OP12-092',
  /** OP11-064 Saldeath: Purple, cost 6, 8000, {Impel Down}. Vanilla. */
  impel6: 'OP11-064',
  /** OP02-084 Blugori: Purple, cost 1, 3000, {Animal}/{Impel Down}. Vanilla. */
  impel1: 'OP02-084',
  /** OP02-088 Sphinx: Purple, cost 4, 6000, {Animal}/{Impel Down}. Vanilla. */
  impel4: 'OP02-088',
  /** OP02-053 Crocodile: Blue, cost 5, 7000, {Impel Down}/{Former Baroque Works}. Vanilla. */
  impel5: 'OP02-053',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. Vanilla (named [Camie]). */
  camieVan: 'OP03-101',
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, {Neptunian}. Vanilla. */
  neptunian6: 'OP11-026',
  /** OP11-111 Mamboshi: Yellow, cost 6, 7000, {Merfolk}/{Fish-Man Island}. Vanilla. */
  fmi6: 'OP11-111',
  /** OP11-113 Ryuboshi: Yellow, cost 5, 7000, {Merfolk}/{Fish-Man Island}. Vanilla. */
  fmi5: 'OP11-113',
  /** OP11-032 Surume: Green, cost 5, 6000, {Animal}/{Fish-Man Island}. Vanilla. */
  fmi5b: 'OP11-032',
  /** OP03-111 Charlotte Praline: Yellow, cost 3, 5000, {The Sun Pirates}/{Merfolk}. Vanilla. */
  merfolk3: 'OP03-111',
  /** OP02-033 Jinbe: Green, cost 2, 4000, {FILM}/{Fish-Man}/{Straw Hat Crew}. Vanilla. */
  fishMan2: 'OP02-033',
  /** OP03-103 Bobbin the Disposer: Yellow, cost 2, 4000, {Big Mom Pirates}. Vanilla. */
  bmp2: 'OP03-103',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, {Big Mom Pirates}. Vanilla. */
  bmp4: 'OP03-106',
  /** OP04-107 Charlotte Perospero: Yellow, cost 6, 8000, {Big Mom Pirates}. Vanilla. */
  bmp6: 'OP04-107',
  /** ST07-002 Charlotte Anana: Yellow, cost 1, 3000, {Big Mom Pirates}. Vanilla. */
  bmp1: 'ST07-002',
  /** OP04-114 Randolph: Yellow, cost 5, 7000, {Big Mom Pirates}/{Homies}. Vanilla (old printing, not OP11-077). */
  randolphOld: 'OP04-114',
  /** OP01-007 Caribou: Red, cost 3, 4000, {Caribou Pirates}/{Supernovas}. [On K.O.] only (named [Caribou]). */
  caribou3: 'OP01-007',
  /** OP10-104 Caribou: Yellow, cost 4, 5000, {Caribou Pirates}/{Supernovas}. Passive only (named [Caribou]). */
  caribou4: 'OP10-104',
  /** OP17-101 Caribou: Yellow, cost 5, 6000, [Activate: Main] only (named [Caribou], cost 5). */
  caribou5: 'OP17-101',
  /** OP11-083 Caribou: Black, cost 1, 2000, [Blocker] (named [Caribou], cost 1). Card under test. */
  caribou1: 'OP11-083',
} as const;

/** Events used as scenery. */
export const EV11 = {
  /** ST01-014 Guard Point: Red Event, cost 1 ([Counter] only). A plain Event. */
  plain: 'ST01-014',
  /** OP11-099 I'm Gonna Be a Navy Officer!!!: Black Event {Navy}/{East Blue}, cost 1. */
  navyEvent: 'OP11-099',
} as const;

/** A p1 Main Phase with `spec` for p1 (Leader `leader`, 10 active DON!!) and `p2` for the opponent. */
export function me(
  leader: string | PlayerSpec['leader'],
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader: string = LD11.plain,
): TestGame {
  return myTurn(
    side(LD11.plain, BLUE, { costArea: { active: 10, rested: 0 }, ...spec, leader }),
    side(p2Leader, RED, p2),
  );
}

/** p2's Main Phase; p1 defends, with `spec` for p1 and `p2` for the attacker's side (10 active DON!!). */
export function them(
  leader: string | PlayerSpec['leader'],
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  p2Leader: string = LD11.plain,
): TestGame {
  return theirTurn(
    side(LD11.plain, BLUE, { costArea: { active: 0, rested: 0 }, ...spec, leader }),
    side(p2Leader, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** `n` copies of a card. */
export function many(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** A Life row: card ids or placements (for face-up cards). */
export type LifeRow = (CardId | CardPlacement)[];

/** A face-up Life card placement. */
export function up(card: CardId): { card: CardId; faceUp: true } {
  return { card, faceUp: true };
}

/** A Life row of `n` face-up filler cards, or of the given cards, all face-up. */
export function lifeUp(n: number, filler: CardId = BLUE): { card: CardId; faceUp: true }[] {
  return Array.from({ length: n }, () => up(filler));
}

/** Instance ids of every card in `who`'s zone, top first. */
export function zoneIds(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): InstanceId[] {
  return g.zone(who, zone).map((c) => c.instance);
}

/** Face states of `who`'s Life, top first (true = face-up). */
export function lifeFaces(g: TestGame, who: PlayerId = 'p1'): boolean[] {
  return g.zone(who, 'life').map((c) => c.faceUp);
}

/** Pick the one `{ option }` named `id` in the pending mode `choose`. */
export function pickOption(g: TestGame, id: string): void {
  const d = need(g, 'choose');
  const ok = (d.options ?? []).some((o) => o.id === id);
  if (!ok) throw new Error(`Option ${id} not offered; got ${(d.options ?? []).map((o) => o.id)}`);
  act(g, { type: 'pick', choice: { option: id } });
}

/** Ids of the named options of the pending `choose`. */
export function optionIds(g: TestGame): string[] {
  return (decision(g)?.options ?? []).map((o) => o.id);
}

/** True when the pending decision is a `choose` that offers `i`. */
export function offers(g: TestGame, i: InstanceId): boolean {
  return kind(g) === 'choose' && choices(g).includes(i);
}

/** True when the pending decision is a `choose` that offers no card pick and allows `done`. */
export function onlyDone(g: TestGame): boolean {
  return kind(g) === 'choose' && choices(g).length === 0 && canFinish(g);
}

/** Total DON!! on the field of `who`: cost area plus given. */
export function donField(g: TestGame, who: PlayerId = 'p1'): number {
  const d = queries.don(g.state, who);
  return d.active + d.rested + d.given;
}

/** Count of `who`'s cards in a zone. */
export function cnt(g: TestGame, who: PlayerId, zone: Parameters<TestGame['zone']>[1]): number {
  return g.zone(who, zone).length;
}

/** Answer the pending `order` decision of `who` with its first listed order (strict: it must be pending). */
export function orderFirst(g: TestGame, who?: PlayerId): void {
  need(g, 'order', who);
  const a = g.legal().find((x) => x.type === 'order');
  if (!a) throw new Error('order decision with no legal order');
  g.act(a);
}

/** The last `n` card ids of `who`'s deck (the bottom `n`, bottom last). */
export function deckBottom(g: TestGame, who: PlayerId, n: number): CardId[] {
  const ids = g.zone(who, 'deck').map((c) => c.card);
  return ids.slice(Math.max(0, ids.length - n));
}

/** Number of cards in `who`'s deck. */
export function deckSize(g: TestGame, who: PlayerId = 'p1'): number {
  return g.zone(who, 'deck').length;
}

/** True when the pending decision is the "how many DON!! (up to N)" count question. */
export function asksCount(g: TestGame): boolean {
  if (kind(g) !== 'choose') return false;
  const d = need(g, 'choose');
  return d.purpose === 'mode' && /how many/i.test(d.prompt);
}

/** Count ids offered by the pending "how many" question. */
export function countOptions(g: TestGame): string[] {
  const d = need(g, 'choose');
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending "how many DON!!" count question with `n` (strict: it must be asked and offer `n`). */
export function addDon(g: TestGame, n: number): void {
  const opts = countOptions(g);
  if (!opts.includes(String(n))) throw new Error(`Count ${n} not offered; got ${opts}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/**
 * Pay a DON!! cost (rest or return N DON!!) of `from` class if the engine asks which; when only one
 * class can pay it may pay on its own, so nothing is asked. Never answers any other kind of prompt.
 */
export function payDonIfAsked(
  g: TestGame,
  n: number,
  from: 'costActive' | 'costRested' = 'costActive',
): void {
  for (let i = 0; i < n; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.purpose !== 'cost') return;
    const opts = donChoices(g);
    if (!opts.length) return;
    act(g, { type: 'pick', choice: opts.find((o) => o.from === from) ?? opts[0]! });
  }
}

/** DON!! summary of `who` (deck, active, rested, given). */
export function dn(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** Cost of an instance (modifiers included), null if unavailable. */
export function costNow(g: TestGame, i: InstanceId): number | null {
  return g.card(i).cost ?? null;
}
