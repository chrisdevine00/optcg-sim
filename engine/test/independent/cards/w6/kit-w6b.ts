/**
 * Helpers for the wave 6 group B independent card tests (OP10-027, OP11-102, OP12-058, OP12-075,
 * OP12-080, OP12-109, OP12-113, OP13-106, OP13-119, PRB01-001, ST16-002). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and fails
 * on anything else; where a test asks whether a prompt appears it uses raw `g.act` / `decision`.
 * Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import type { CardId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardIds, decision } from '../../helpers.ts';

export * from '../w5/kit-w5b.ts';

/** Scenery used by the wave 6 group B tests. */
export const W6 = {
  /** OP12-025 Kin'emon: Green, cost 6, 8000, Counter +1000, {Land of Wano}/{The Akazaya Nine}. Vanilla. */
  kin6: 'OP12-025',
  /** OP04-102 Kin'emon: Yellow, cost 6, 6000, {Land of Wano}. Only an [Activate: Main] (inert in hand). */
  kin6b: 'OP04-102',
  /** OP14-024 Kin'emon: Green, cost 4, 5000, Counter +1000. [On Play] only (inert in hand). */
  kin4: 'OP14-024',
  /** OP10-026 Kin'emon: Green, cost 2, 1000, Counter +1000. [Activate: Main] only. */
  kin1000: 'OP10-026',
  /** OP10-027 Kin'emon: Green, cost 2, 0 power, Counter +2000. The card under test. */
  kin0: 'OP10-027',
  /** ST32-001 Kin'emon: Green, cost 1, 2000, Counter +1000. [On Play] only (inert in the trash). */
  kin2000: 'ST32-001',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. Vanilla; not a Kin'emon. */
  thatch: 'OP02-007',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-003 Atmos: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  atmos: 'OP02-003',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. Vanilla. */
  marcoFormer: 'OP01-023',
  /** EB01-005 Doma: Red, cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. Vanilla. */
  doma: 'EB01-005',
  /** OP09-047 Kouzuki Oden: Blue, cost 9, 10000, {Land of Wano}/{Whitebeard Pirates}. [Double Attack], [On K.O.] only. */
  oden9: 'OP09-047',
  /** OP08-043 Edward.Newgate: Blue, cost 10, 12000, {The Four Emperors}/{Whitebeard Pirates}. [On Play] only. */
  newgate10: 'OP08-043',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  shiki8: 'OP12-005',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
  zoroSn4: 'OP02-043',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}. Vanilla. */
  urouge5: 'OP10-101',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, Counter +1000, {On-Air Pirates}/{Supernovas}. Vanilla. */
  apooSn3: 'OP14-008',
  /** OP17-107 Charlotte Daifuku: Yellow, cost 3, 4000, Counter +2000, {Big Mom Pirates}, no effect text, "[Trigger] Play this card." (scripted, unlike OP01-104). */
  trig: 'OP17-107',
  /** OP07-076 Slow-Slow Beam Sword: Purple Event, cost 2, [Counter] DON!! -1: +2000 power this battle, then rest up to 1 opposing Character. */
  beamSword: 'OP07-076',
  /** OP05-077 Gamma Knife: Purple Event, cost 2, [Main] DON!! -1: gives up to 1 opposing Character -5000 power this turn. */
  gammaKnife: 'OP05-077',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** EB01-023 Edward Weevil: Blue, cost 4, 6000, [On Play] Draw 1 card. */
  onPlay4: 'EB01-023',
  /** OP03-012 Marshall.D.Teach: Red, cost 4, 6000, {Whitebeard Pirates}, [When Attacking] only. */
  whenAtt4: 'OP03-012',
  /** OP01-007 Caribou: Red, cost 3, 4000, Counter +1000, [On K.O.] only. */
  onKO3: 'OP01-007',
  /** OP01-009 Carrot: Red, cost 2, 3000, Counter +1000, no effect, "[Trigger] Play this card." */
  carrot: 'OP01-009',
  /** OP02-012 Blenheim: Red, cost 2, 3000, {Whitebeard Pirates}, [Blocker] only. */
  blenheim: 'OP02-012',
  /** OP05-056 X.Barrels: Blue, cost 2, 2000, Counter +1000, [On Play] only (a character with an [On Play] effect). */
  onPlay2: 'OP05-056',
  /** EB02-008 The Peak: Red Event, cost 2, type {Music}. */
  music1: 'EB02-008',
  /** EB02-020 We Are!: Green Event, cost 2, type {Music}. */
  music2: 'EB02-020',
  /** EB02-031 Hope: Blue Event, cost 2, type {Music}. */
  music3: 'EB02-031',
} as const;

/** Card ids of a zone, sorted (hand and trash are unordered for most checks). */
export function sorted(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return cardIds(g, who, zone).sort();
}

/** Debug string of every public zone (only for writing tests; failure messages). */
export function snap(g: TestGame): string {
  const z = (p: PlayerId, zn: Parameters<TestGame['zone']>[1]) => cardIds(g, p, zn).join(',');
  const d = decision(g);
  return [
    `p1 hand[${z('p1', 'hand')}] chars[${z('p1', 'characters')}] stage[${z('p1', 'stage')}] life[${z('p1', 'life')}] trash[${z('p1', 'trash')}]`,
    `p2 hand[${z('p2', 'hand')}] chars[${z('p2', 'characters')}] life[${z('p2', 'life')}] trash[${z('p2', 'trash')}]`,
    `decision ${d?.player}:${d?.kind}/${d?.purpose} ${d?.prompt}`,
  ].join('\n');
}
