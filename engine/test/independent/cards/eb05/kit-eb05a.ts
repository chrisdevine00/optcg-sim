/**
 * Helpers for the EB05 group-A independent card tests. Public API, frozen fixtures, `../kit.ts` and
 * `../m4b/kit-a.ts` only. Scenery stats are noted next to each constant; tests repeat the ones they
 * rely on.
 */
import type { CardId, InstanceId } from '@optcg/engine';
import { act, attack, decision, endTurn, noDefence, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardOf, choices } from '../kit.ts';

export * from '../m4b/kit-a.ts';
export { act, decision, play, attack, passBlock, noDefence, endTurn };

/** Leaders with no automatic effect (only [Activate: Main] or "cannot attack"). */
export const EL = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. */
  supernovas: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. */
  croc: 'ST03-001',
  /** OP02-071 Magellan: Purple, 6000, 5 Life, {Impel Down}. Only a DON!!-return trigger. */
  magellan: 'OP02-071',
  /** OP11-022 Shirahoshi: Green/Yellow, 5000, 5 Life, {Merfolk}/{Fish-Man Island}, named [Shirahoshi]. */
  shirahoshi: 'OP11-022',
  /** OP06-020 Hody Jones: Green, 5000, 5 Life, {Fish-Man}/{New Fish-Man Pirates}. */
  fishMan: 'OP06-020',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. */
  wano: 'ST09-001',
} as const;

/** Vanilla (or effect-free on play) scenery Characters. */
export const EC = {
  /** OP14-003 Capone"Gang"Bege: Red, cost 1, 2000, {Supernovas}; only a permanent K.O. protection. */
  bege2000: 'OP14-003',
  /** OP14-005 Killer: Red, cost 1, 1000, {Supernovas}; only an [Activate: Main]. */
  killer1000: 'OP14-005',
  /** OP15-105 Jewelry Bonney: Yellow, cost 1, 2000, {Supernovas}; only a replacement effect. */
  bonney2000: 'OP15-105',
  /** OP10-031 Sengoku: Green, cost 5, 7000, {Navy}, Wisdom. */
  sengoku: 'OP10-031',
  /** OP11-015 Mocha: Red, cost 4, 6000, Counter +1000, {Punk Hazard}, Wisdom, vanilla. */
  mocha: 'OP11-015',
  /** OP13-088 Terry Gilteo: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}, Wisdom, vanilla. */
  terry: 'OP13-088',
  /** OP02-007 Thatch: Red, cost 6, 8000, Wisdom, vanilla. */
  thatchWisdom: 'OP02-007',
  /** OP17-046 Gloriosa: Blue, cost 4, 1000, no Counter, {Rocks Pirates}, Wisdom, [Blocker] (a data keyword). */
  blockerWisdom: 'OP17-046',
  /** OP01-043 Shinobu: Green, cost 3, 5000, {Land of Wano}, Special, vanilla. */
  shinobu: 'OP01-043',
  /** OP15-016 Fullbody: Red, cost 5, 6000, Counter +2000, {Navy}, Strike, vanilla. */
  fullbody: 'OP15-016',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}, vanilla. */
  komille1: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}, vanilla. */
  doberman2: 'OP02-107',
  /** OP13-090 Hack: Black, cost 6, 7000, {Fish-Man}/{Revolutionary Army}, vanilla. */
  hack6: 'OP13-090',
} as const;

/** Events used as scenery in hand (never played unless a test says so). */
export const EV = {
  /** ST01-014 Guard Point: Red Event, cost 1, [Counter] +3000. */
  redA: 'ST01-014',
  /** OP01-029 Radical Beam!!: Red Event, cost 1, [Counter] +2000. */
  redB: 'OP01-029',
  /** OP04-017 Happiness Punch: Red Event, cost 1, [Counter] -2000. */
  redC: 'OP04-017',
  /** ST29-015 Raw Heat Strike: Yellow Event, cost 1, [Counter] +2000. */
  yellow: 'ST29-015',
} as const;

/** Instance of the nth offered candidate with this card id in the pending `choose`. */
export function offeredInstance(g: TestGame, card: CardId, nth = 0): InstanceId {
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) throw new Error(`${card} is not offered`);
  return hit;
}

/** End p1's turn and p2's turn, returning to p1's Main Phase of the next turn. */
export function throughOpponentTurn(g: TestGame): void {
  endTurn(g);
  endTurn(g);
}

/** Answer every pending `order` decision of the deciding player with its first legal ordering. */
export function finishOrders(g: TestGame): void {
  for (let i = 0; i < 5 && decision(g)?.kind === 'order'; i++) {
    g.act(g.legal().find((a) => a.type === 'order')!);
  }
}

/** Pick the named option of a "choose one" whose label matches `re`. Throws listing the labels. */
export function pickMode(g: TestGame, re: RegExp): void {
  const options = decision(g)?.options ?? [];
  const hit = options.find((o) => re.test(o.label));
  if (!hit) throw new Error(`No option matches ${re}; options: ${JSON.stringify(options)}`);
  act(g, { type: 'pick', choice: { option: hit.id } });
}

/** Power of the first p2 Character with this id. */
export function p2power(g: TestGame, card: CardId): number | null {
  return g.power(g.find('p2', 'characters', card));
}
