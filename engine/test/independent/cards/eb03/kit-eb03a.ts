/**
 * Helpers for the EB-03 group-A independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Every answer helper accepts ONE named kind of prompt and fails on anything else (see
 * kit-op17b.ts). Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind } from '../kit.ts';
import { offeredAbilities, useAbility } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. */
export const LA = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, Strike, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  supernovas: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, Special, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP04-001 Nefeltari Vivi: Blue/Red, 5000, 5 Life, Slash, {Alabasta}. Cannot attack; [Activate: Main] only. */
  vivi: 'OP04-001',
  /** OP10-003 Sugar: Purple/Red, 5000, 4 Life, Special, {Donquixote Pirates}. [End of Your Turn] / [Opponent's Turn] only. */
  sugar: 'OP10-003',
  /** OP01-031 Kouzuki Oden: Green, 5000, 5 Life, Slash, {Land of Wano}/{Kouzuki Clan}. [Activate: Main] only. */
  oden: 'OP01-031',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, Strike, {Land of Wano}. Only an [Opponent's Turn] boost at 2 or less Life. */
  wano: 'ST09-001',
  /** OP06-020 Hody Jones: Green, 5000, 5 Life, Strike, {Fish-Man}/{New Fish-Man Pirates}. [Activate: Main] only. */
  fishMan: 'OP06-020',
  /** OP11-022 Shirahoshi: Green/Yellow, 5000, 5 Life, Wisdom, {Merfolk}/{Fish-Man Island}. Cannot attack. */
  merfolk: 'OP11-022',
  /** OP07-038 Boa Hancock: Blue, 5000, 5 Life, Special, {Kuja Pirates}/{The Seven Warlords of the Sea}. Stats only (no script): inert. */
  hancock: 'OP07-038',
  /** OP11-062 Charlotte Katakuri: Purple, 5000, 5 Life, Strike, {Big Mom Pirates}. [When Attacking] only. */
  katakuri: 'OP11-062',
} as const;

/** Scenery Characters with the stats the tests rely on (no effect that fires on play or when it matters). */
export const SA = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. No type. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  oars: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. */
  shiki8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter, [On Play] only. */
  mihawk9: 'OP01-070',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000, {Alabasta}. Inert alone. */
  cobra0: 'OP04-012',
  /** OP14-005 Killer: Red, cost 1, 1000, Counter +1000, {Kid Pirates}/{Supernovas}. Only an [Activate: Main]. */
  killer1000: 'OP14-005',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  dadan2000: 'OP13-009',
  /** OP05-110 Holly: Yellow, cost 3, 5000, Counter +1000, {Animal}/{Sky Island}. Vanilla. */
  holly: 'OP05-110',
  /** ST08-012 Laboon: Black, cost 4, 6000, Counter +1000, {Animal}. Vanilla. */
  laboon: 'ST08-012',
  /** OP02-077 Solitaire: Purple, cost 3, 5000, Counter +1000, {Animal Kingdom Pirates}/{SMILE}. Vanilla. */
  solitaire: 'OP02-077',
  /** OP12-111 Baby 5: Yellow, cost 2, 4000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  baby5: 'OP12-111',
  /** OP10-073 Buffalo: Purple, cost 4, 6000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  buffalo6: 'OP10-073',
  /** OP12-064 Vergo: Purple, cost 5, 7000, Counter +1000, {Donquixote Pirates}/{Navy}/{Punk Hazard}. Vanilla. */
  vergo7: 'OP12-064',
  /** OP12-076 Monet: Purple, cost 5, 6000, Counter +2000, {Donquixote Pirates}/{Punk Hazard}. Vanilla. */
  monetVan: 'OP12-076',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. Vanilla. */
  camieVan: 'OP03-101',
  /** OP03-007 Namule: Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Whitebeard Pirates}. Vanilla. */
  namule: 'OP03-007',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
  zoroFilm: 'OP02-043',
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  usoppFilm: 'OP02-028',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. Vanilla. */
  gordonFilm: 'ST05-007',
  /** OP13-011 Nefeltari Cobra: Red, cost 5, 6000, Counter +2000, {Alabasta}. Vanilla. */
  cobra5: 'OP13-011',
  /** OP14-030 Chaka & Pell: Green, cost 6, 7000, Counter +2000, {Alabasta}. Vanilla. */
  chakaPell6: 'OP14-030',
  /** ST01-009 Nefeltari Vivi: Red, cost 2, 4000, Counter +1000, {Alabasta}. Vanilla. */
  viviChar: 'ST01-009',
  /** OP15-089 Franky: Black, cost 5, 6000, Counter +2000, {Straw Hat Crew}. Vanilla. */
  frankyShc5: 'OP15-089',
  /** OP05-065 San-Gorou: Purple, cost 6, 8000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  sanGorou6: 'OP05-065',
  /** ST20-001 Charlotte Katakuri: Yellow, cost 5, 6000, Counter +1000, {Big Mom Pirates}, [Blocker]. */
  katakuriChar: 'ST20-001',
  /** OP08-039 Zou: Green Stage, cost 3, {Animal}. */
  zou: 'OP08-039',
  /** ST01-014 Guard Point: Red Event, cost 1. Stats only: a plain Event card with no script. */
  guardPoint: 'ST01-014',
  /** ST29-015 Raw Heat Strike: Yellow Event, cost 1, [Counter] +2000 power during this battle (the -2000 part needs 1 or less Life); [Trigger] Draw 1 card. */
  boost2000: 'ST29-015',
  /** OP17-038 I Think He's Seen an Ugly Future...: Green Event, cost 0, [Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters. */
  restEvent: 'OP17-038',
  /** EB04-020 Shark Brick Fist: Green Event, cost 1, [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less. */
  restTrigger: 'EB04-020',
} as const;

/** Card ids in a zone of `who` (sorted). */
export function zoneIds(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return g
    .zone(who, zone)
    .map((c) => c.card)
    .sort();
}

/** The nth card of `card` in a zone of `who`. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** Rested state of a Character of `who`. */
export function isRestedC(g: TestGame, who: PlayerId, card: CardId, nth = 0): boolean {
  return g.card(g.find(who, 'characters', card, nth)).rested;
}

/** True when the deciding player owes a `choose` that shows (or hides) nothing: min 0, no candidates. */
export function emptyPick(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && choices(g).length === 0 && canFinish(g);
}

/** Answer an empty "up to" `choose` if one is pending; otherwise do nothing. */
export function finishEmptyPick(g: TestGame): void {
  if (emptyPick(g)) act(g, { type: 'done' });
}

/** The kind of the pending decision. */
export function dk(g: TestGame): string | null {
  return kind(g);
}

/**
 * p2 (turn player of a `theirs` game) attacks p1's Leader with its Leader; p1 declines to block and
 * the game stops at p1's Counter Step.
 */
export function toCounterStep(g: TestGame): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  if (decision(g)?.kind === 'block') act(g, { type: 'block', blocker: null });
}

/** The Counter-Step action that uses the Event `card` (instance) from hand. */
export function counterOf(g: TestGame, card: InstanceId) {
  return g.legal().find((a) => (a.type === 'activate' || a.type === 'counter') && a.card === card);
}

/**
 * Activate the single [Activate: Main] on `card`; a "you may" cost question, if asked, is answered
 * yes (choosing to activate is choosing to pay). Any other prompt is left pending.
 */
export function useYes(g: TestGame, card: InstanceId): void {
  useAbility(g, card);
  const d = decision(g);
  if (d?.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept)) {
    act(g, { type: 'optional', accept: true });
  }
}

/** True when an [Activate: Main] is offered on `card` now. */
export function canUseAbility(g: TestGame, card: InstanceId): boolean {
  return offeredAbilities(g, card).length > 0;
}

/** Pick the DON!! class `from` in the pending `choose`; throws when it is not offered. */
export function pickDonClass(g: TestGame, from: 'costActive' | 'costRested'): void {
  const hit = donChoices(g).find((o) => o.from === from);
  if (!hit) throw new Error(`No ${from} DON!! offered; offered ${JSON.stringify(donChoices(g))}`);
  act(g, { type: 'pick', choice: hit });
}

/** The DON!! classes offered by the pending `choose`, as strings. */
export function donClassNames(g: TestGame): string[] {
  return donChoices(g)
    .map((o) => o.from)
    .sort();
}
