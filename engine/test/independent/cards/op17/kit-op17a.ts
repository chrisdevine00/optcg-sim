/**
 * Helpers for the OP-17 group-A independent card tests. Public API, frozen fixtures, `../kit.ts`,
 * `../m4b/kit-a.ts` and `../eb05/kit-eb05a.ts` only. Scenery stats are noted next to each constant;
 * tests repeat the ones they rely on.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { accept, choices, choose, cardOf, kind, payDon } from '../kit.ts';
import { act } from '../../helpers.ts';
import { playCard } from '../m4b/kit-a.ts';

export * from '../eb05/kit-eb05a.ts';

/** Leaders. */
export const LD = {
  /** OP17-001 Edward.Newgate: Red, 5000, 5 Life, {The Four Emperors}/{Whitebeard Pirates}. */
  newgate: 'OP17-001',
  /** ST01-001 Monkey.D.Luffy: Red (monocoloured), 5000, 5 Life, {Straw Hat Crew}. Only [Activate: Main]. */
  luffy: 'ST01-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, 4 Life. */
  law: 'OP01-002',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. */
  wano: 'ST09-001',
  /** OP17-020 Shanks: Green, 5000, 5 Life, {The Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'OP17-020',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. Only [Activate: Main]. */
  shanksP: 'ST05-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. */
  croc: 'ST03-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. Only [Activate: Main]. */
  greenKid: 'ST02-001',
  /** OP02-001 Edward.Newgate: Red, 6000, 6 Life, {The Four Emperors}/{Whitebeard Pirates}. */
  newgate6: 'OP02-001',
} as const;

/** Inert scenery Characters ({Whitebeard Pirates} family). */
export const WB = {
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP03-006 Speed Jil: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. */
  jil: 'OP03-006',
  /** EB01-005 Doma: Red, cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. */
  doma: 'EB01-005',
  /** OP03-007 Namule: Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Whitebeard Pirates}. */
  namule: 'OP03-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  littleOars: 'OP02-020',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  formerMarco: 'OP01-023',
  /** ST22-008 Decalvan Brothers: Blue, cost 2, 4000, Counter +1000, {Whitebeard Pirates Allies}. */
  decalvan: 'ST22-008',
  /** OP16-016 Ramba: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates Allies}. */
  ramba: 'OP16-016',
  /** OP17-006 Kingdew: Red, cost 7, 8000, Counter +2000, {Whitebeard Pirates}. */
  kingdew7: 'OP17-006',
} as const;

/** Inert scenery Characters of other families. */
export const SC2 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  komachiyo: 'OP01-010',
  /** OP01-043 Shinobu: Green, cost 3, 5000, Counter +1000, {Land of Wano}. */
  shinobu: 'OP01-043',
  /** OP01-092 Urashima: Purple, cost 7, 9000, Counter +1000, {Land of Wano}. */
  urashima: 'OP01-092',
  /** ST09-006 Kouzuki Momonosuke: Yellow, cost 2, 4000, Counter +1000, {Land of Wano}/{Kouzuki Clan}. */
  momo: 'ST09-006',
  /** OP09-016 Rockstar: Red, cost 4, 6000, Counter +1000, {Red-Haired Pirates}. */
  rockstar: 'OP09-016',
  /** OP09-006 Howling Gab: Red, cost 5, 7000, Counter +1000, {Red-Haired Pirates}. */
  gabRed: 'OP09-006',
  /** P-023 Yasopp: Red, cost 6, 8000, Counter +1000, {FILM}/{Red-Haired Pirates}. */
  yasopp: 'P-023',
  /** P-021 Benn.Beckman: Red, cost 7, 9000, Counter +1000, {FILM}/{Red-Haired Pirates}. */
  beckmanP: 'P-021',
  /** P-016 Shanks: Red, cost 8, 10000, Counter +1000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
  shanksP016: 'P-016',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, no printed Counter. */
  xebec: 'OP17-118',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  dadan2000: 'OP13-009',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}. Inert without DON!!. */
  whiteyBay2000: 'OP02-014',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0, Counter +1000, {Alabasta}. Inert alone. */
  cobra0: 'OP04-012',
  /** OP05-077 Gamma Knife: Purple Event, cost 2, [Main] DON!! -1: opposing Character -5000 this turn; add up to 1 DON!! (rested). */
  gammaKnife: 'OP05-077',
  /** ST21-017 Gum-Gum Mole Pistol: Red Event, cost 4, [Main] opposing Character -5000 this turn; then, with a 6000+ Character of yours, K.O. up to 1 with 2000 power or less. */
  molePistol: 'ST21-017',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less; add up to 1 DON!!. */
  lightning: 'OP09-077',
  /** OP12-038 Two-Sword Style Rashomon: Green Event, cost 1, [Main] rest 2 DON!!: K.O. up to 2 rested Characters with a base cost of 4 or less. */
  rashomon: 'OP12-038',
} as const;

/** The deciding player owes a `main` decision. */
export function expectMain(g: TestGame, player: PlayerId = 'p1'): void {
  const d = decision(g);
  expect(`${d?.player}:${d?.kind}`).toBe(`${player}:main`);
}

/** Power of a Leader. */
export function lp(g: TestGame, player: PlayerId): number | null {
  return g.power(g.leader(player));
}

/** Power of the nth Character with this card id in a zone of `player`. */
export function cp(g: TestGame, player: PlayerId, card: CardId, nth = 0): number | null {
  return g.power(g.find(player, 'characters', card, nth));
}

/** Instance of the nth Character offered in the pending `choose`, by card id (throws if absent). */
export function offeredCard(g: TestGame, card: CardId, nth = 0): InstanceId {
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) throw new Error(`${card} is not offered (decision ${kind(g)})`);
  return hit;
}

/** Throw if any `choose` is pending that would offer one of these instances. */
export function expectNotOffered(g: TestGame, ...instances: InstanceId[]): void {
  for (const i of instances) expect(choices(g)).not.toContain(i);
}

/** p1's Character with this card id is rested? */
export function isRested(g: TestGame, player: PlayerId, card: CardId, nth = 0): boolean {
  return g.card(g.find(player, 'characters', card, nth)).rested;
}

/** The Characters of `player` (card ids, sorted). */
export function charsOf(g: TestGame, player: PlayerId): CardId[] {
  return g
    .zone(player, 'characters')
    .map((c) => c.card)
    .sort();
}

/**
 * The deciding player (p2 on their own turn) plays OP09-077 Gum-Gum Lightning (cost: DON!! -2) and
 * K.O.s `target` (a card of the other player, 6000 power or less). Stops at the first decision the
 * K.O. causes (a replacement, an [On K.O.], or the end of the effect).
 */
export function opponentKOs(g: TestGame, target: InstanceId): void {
  playCard(g, SC2.lightning);
  accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

/** The defender blocks with `blocker` (the Block Step decision must be pending). */
export function blockWith(g: TestGame, blocker: InstanceId): void {
  act(g, { type: 'block', blocker });
}
