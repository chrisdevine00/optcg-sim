/**
 * Helpers for the wave-7 group-A independent card tests (EB02-009, EB02-053, EB02-057, EB03-006,
 * EB04-023, OP09-101, OP10-022, OP10-116, OP11-101, OP11-116). Public API, frozen fixtures and the
 * earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on anything
 * else; where a test asks whether a prompt appears it uses raw `g.act` / `decision`.
 */
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../w6/kit-w6a.ts';

/** Leaders used as scenery (printed). */
export const L7 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. Not {Alabasta}. */
  luffy: 'ST01-001',
  /** OP04-001 Nefeltari Vivi: Blue/Red, 5000, 5 Life, {Alabasta}. Cannot attack; [Activate: Main] with a DON!! cost only. */
  viviAlabasta: 'OP04-001',
  /** EB03-001 Nefeltari Vivi: Blue/Red, 5000, 4 Life, {Alabasta}. Can attack; its text only matters when a Character with base cost 4+ would be K.O.'d or it is activated. */
  vivi4: 'EB03-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, 4 Life, {Heart Pirates}/{Supernovas}. [Activate: Main] only. */
  law: 'OP01-002',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, no {Alabasta}. [Activate: Main] only. */
  crocodile: 'ST03-001',
} as const;

/** Scenery Characters. Printed stats noted; none has text unless said. */
export const S7 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, {Animal}/{Land of Wano}. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, {Happosui Army}. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, {Former Whitebeard Pirates}. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, {Giant}/{New Giant Pirates}. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, {Whitebeard Pirates}. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, {Whitebeard Pirates}. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, {Giant}/{Whitebeard Pirates Allies}. */
  c7: 'OP02-020',
  /** ST01-008 Nico Robin: Red, cost 3, 5000, {Straw Hat Crew}. */
  shc3: 'ST01-008',
  /** ST01-010 Franky: Red, cost 4, 6000, {Straw Hat Crew}. */
  shc4: 'ST01-010',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, {FILM}/{Straw Hat Crew}. */
  shc1: 'P-015',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  zoro: 'OP02-043',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, {On-Air Pirates}/{Supernovas}. */
  sn3: 'OP14-008',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, {Fallen Monk Pirates}/{Supernovas}. */
  sn5: 'OP10-101',
  /** OP10-105 Cavendish: Yellow, cost 6, 8000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}. */
  sn6: 'OP10-105',
  /** OP17-100 Capone"Gang"Bege: Yellow, cost 7, 8000, {Supernovas}/{Firetank Pirates}; the same NAME as OP11-101. */
  bege7: 'OP17-100',
  /** OP01-080 Miss Doublefinger(Zala): Blue, cost 3, 4000, "[On K.O.] Draw a card.". */
  zala: 'OP01-080',
  /** OP01-104 Speed: Purple, cost 2, 3000, "[Trigger] Play this card.". */
  speed: 'OP01-104',
} as const;

/** The pending decision's option ids (named options), in the order offered. */
export function optionIds(g: TestGame): string[] {
  const d = decision(g);
  if (d?.kind !== 'choose') return [];
  return g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice
        ? [a.choice.option]
        : [],
    );
}

/** Pick the named option; it must be offered by the pending `choose`. */
export function pickOption(g: TestGame, id: string, who?: PlayerId): void {
  need(g, 'choose', who);
  const offered = optionIds(g);
  if (!offered.includes(id)) throw new Error(`Option ${id} not offered; offered ${offered}`);
  act(g, { type: 'pick', choice: { option: id } });
}

/** True when the pending decision is a `choose` of named options owed by `who`. */
export function asksOption(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who && optionIds(g).length > 0;
}

/** Card ids of `who`'s Life, top first. */
export function lifeOf(g: TestGame, who: PlayerId): CardId[] {
  return g.zone(who, 'life').map((c) => c.card);
}

/** Face-up flags of `who`'s Life, top first. */
export function lifeFaces(g: TestGame, who: PlayerId): boolean[] {
  return g.zone(who, 'life').map((c) => c.faceUp);
}

/** Card ids of `who`'s hand, sorted. */
export function handOf(g: TestGame, who: PlayerId): CardId[] {
  return g
    .zone(who, 'hand')
    .map((c) => c.card)
    .sort();
}

/** Anomaly events: a test of a clean effect expects none. */
export function anomalies(g: TestGame): number {
  return g.eventsOfType('Anomaly').length;
}

/** Total DON!! of `who` on the field (cost area plus given). */
export function donTotal(g: TestGame, who: PlayerId): number {
  const d = queries.don(g.state, who);
  return d.active + d.rested + d.given;
}

/** DON!! given to `inst`. */
export function donOnCard(g: TestGame, inst: InstanceId): number {
  return g.card(inst).don;
}
