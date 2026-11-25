/**
 * Helpers for the OP-10 group-C independent card tests (OP10-075 .. OP10-111, 25 cards). Public
 * API, frozen fixtures and the earlier kits only. Answer helpers accept ONE named kind of prompt
 * and fail on anything else, so a missing or extra "up to" / "you may" prompt is caught.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { expect } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { abilities, canFinish, choices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14c.ts';

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const LD10 = {
  /** EB01-040 Kyros: Black/Yellow, 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dress: 'EB01-040',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  nova: 'ST01-001',
  /** OP01-060 Donquixote Doflamingo: Blue, 5000, 5 Life, {Donquixote Pirates}. [DON!! x2][When Attacking] only. */
  dp: 'OP01-060',
  /** OP16-080 Marshall.D.Teach: Black/Yellow, 4 Life, {Blackbeard Pirates}. Only an [Opponent's Turn] cost aura. */
  bbp: 'OP16-080',
  /** OP07-001 Monkey.D.Dragon: Red, 5000, 5 Life, {Revolutionary Army}. [Activate: Main] only. */
  ra: 'OP07-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  plain: 'ST03-001',
  /** OP15-039 Rebecca: Blue, 5000, 5 Life, {Dressrosa}. Cannot attack; [Activate: Main] (needs a hand Character). */
  rebecca: 'OP15-039',
} as const;

/** Scenery cards: vanilla unless noted. */
export const SC10 = {
  /** EB05-041 Koala: Black, cost 2, 4000, {Revolutionary Army}/{Dressrosa}. */
  dr2: 'EB05-041',
  /** OP01-076 Bellamy: Blue, cost 2, 4000, {Dressrosa}. */
  dr2b: 'OP01-076',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, {Dressrosa}. */
  dr3: 'OP10-054',
  /** OP15-049 Hajrudin: Blue, cost 5, 6000, Counter +2000, {Giant}/{Dressrosa}. */
  dr5: 'OP15-049',
  /** OP10-050 Hajrudin: Blue, cost 7, 9000, {Giant}/{Dressrosa}/{New Giant Pirates}. */
  dr7: 'OP10-050',
  /** OP09-082 Avalo Pizarro: Black, cost 4, 6000, {Blackbeard Pirates}. */
  bbp4: 'OP09-082',
  /** OP10-084 Sanjuan.Wolf: Black, cost 5, 7000, {Blackbeard Pirates}/{Giant}. */
  bbp5: 'OP10-084',
  /** ST27-003 Kuzan: Black, cost 6, 6000, {Blackbeard Pirates}/{Former Navy}, [Blocker]. Only used in a trash. */
  bbp6: 'ST27-003',
  /** OP10-082 Kuzan: Black, cost 5, 5000, no Counter. The card under test (a second copy as scenery). */
  kuzan: 'OP10-082',
  /** OP06-094 Lola: Black, cost 4, 6000, {Thriller Bark Pirates}. */
  tb4: 'OP06-094',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. */
  tb4b: 'OP02-054',
  /** OP14-101 Oars: Yellow, cost 8, 10000, {Giant}/{Thriller Bark Pirates}. */
  tb8: 'OP14-101',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, {Fallen Monk Pirates}/{Supernovas}. */
  nova5: 'OP10-101',
  /** OP10-105 Cavendish: Yellow, cost 6, 8000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}. */
  nova6: 'OP10-105',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, {On-Air Pirates}/{Supernovas}. */
  nova3r: 'OP14-008',
  /** P-022 Monkey.D.Luffy: Red, cost 4, 6000, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  nova4r: 'P-022',
  /** OP09-113 Morley: Yellow, cost 4, 6000, {Giant}/{Revolutionary Army}. */
  ra4: 'OP09-113',
  /** OP12-083 Inazuma: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. */
  ra5: 'OP12-083',
  /** OP13-085 Saint Jalmac: Black, cost 2, 4000, {Celestial Dragons}. */
  cd2: 'OP13-085',
  /** OP01-053 Wire: Green, cost 2, 4000, {Kid Pirates}. */
  kid2: 'OP01-053',
  /** OP16-103 ... not used. ST01-014 Guard Point: a red Event with no [Main]. */
  event: 'ST01-014',
} as const;

/** Activate the [Activate: Main] of `card` with a raw action (no helper answers anything). */
export function rawActivate(g: TestGame, card: InstanceId): void {
  const [ability, ...more] = abilities(g, card);
  if (!ability) throw new Error(`No [Activate: Main] is offered on ${card}`);
  if (more.length) throw new Error(`Several abilities on ${card}`);
  act(g, { type: 'activate', card, ability });
}

/** True when `card` has an [Activate: Main] on offer now. */
export function offeredAbility(g: TestGame, card: InstanceId): boolean {
  expect(kind(g)).toBe('main');
  return abilities(g, card).length > 0;
}

/** True while `who` owes a plain Main Phase decision. */
export function onMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** Card ids of one zone, sorted. */
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

/**
 * Pay the "rest 1 of your Dressrosa Leader or Stage" cost: when the engine asks which (more than
 * one candidate), pick `which` ('leader' by default); when it asks nothing there was one candidate.
 * Anything but a cost pick fails.
 */
export function payRestDress(g: TestGame, which: 'leader' | 'stage' = 'leader'): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.player !== 'p1' || d.purpose !== 'cost') return; // one candidate only: paid on its own
  const target = which === 'leader' ? g.leader('p1') : g.zone('p1', 'stage')[0]!.instance;
  expect(choices(g)).toContain(target);
  act(g, { type: 'pick', choice: target });
}

/** Answer any forced empty pick (a `choose` with max 0) owed by anyone. */
export function skipEmpty(g: TestGame): void {
  for (let i = 0; i < 5; i++) {
    const d = decision(g);
    if (d?.kind === 'choose' && d.max === 0 && canFinish(g)) act(g, { type: 'done' });
    else return;
  }
}

export { need };
