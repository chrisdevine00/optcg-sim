/**
 * Constants and helpers for the OP-11 group 2 card tests (OP11-037 .. OP11-070). Every constant is a
 * vanilla, or an unscripted card whose text is inert where the test puts it.
 */
import { project, type ProjectedView } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec } from './helpers.ts';

export { mk, boost, RED_LEADER, EVENT } from './helpers-op15g1.ts';
export { costMod } from './helpers-eb03g2.ts';
export { counterStep, useCounter, finishOrder, cardsOf } from './helpers-luffyace.ts';
export { canPick, activate, offeredAb } from './helpers-w3s.ts';

/** {Neptunian} vanilla Character (cost 6); an {East Blue}{Neptunian} one (cost 6). */
export const NEPT = 'OP11-026';
export const NEPT_EB = 'OP13-010';
/** {Merfolk}{Fish-Man Island} Character (inert in a deck); a {Fish-Man Island} Event. */
export const FMI_CHAR = 'OP11-025';
export const FMI_EVENT = 'EB04-020';
/** {Firetank Pirates} vanillas: cost 3 (Green), cost 5 (Blue). */
export const FIRE3 = 'ST02-002';
export const FIRE5 = 'OP11-052';
/** {GERMA 66} vanilla (Blue, cost 5, 6000); [Vinsmoke Reiju] Leader (Blue/Purple, multicolored, {The Vinsmoke Family}). */
export const GERMA = 'OP11-045';
export const VINSMOKE_LEADER = 'OP06-042';
/** {Fish-Man} Leader (Green); {Merfolk} Character (cost 1, Green); {Fish-Man} Character (cost 3). */
export const FISH_LEADER = 'OP06-020';
export const MERFOLK1 = 'OP03-101';
export const FISH3 = 'OP03-007';
/** {Straw Hat Crew} vanillas: cost 1 / 4 (Green) / 5 (Green). */
export const SHC1 = 'OP04-007';
export const SHC4 = 'OP02-043';
export const SHC5 = 'OP02-039';
/** {Big Mom Pirates} vanillas: Yellow cost 4 (6000); Purple cost 5 (6000) / cost 6 (7000); Yellow cost 2 (4000). */
export const BM_Y4 = 'OP03-106';
export const BM_P5 = 'OP11-078';
export const BM_P6 = 'OP11-068';
export const BM_Y2 = 'ST07-006';
/** [Charlotte Anana] vanilla (Yellow, cost 1, {Big Mom Pirates}). */
export const ANANA_Y = 'ST07-002';
/** {Big Mom Pirates} Leader (Yellow); {Impel Down} Leader (Purple); both have effects that are inert here. */
export const BM_LEADER = 'OP03-099';
export const IMPEL_LEADER = 'OP02-071';

/** What `viewer` remembers of hidden cards by position (`p2.deck.0`). */
export const known = (g: TestGame, viewer: 'p1' | 'p2'): Record<string, string> =>
  (project(g.state, viewer) as unknown as ProjectedView).known;

/** The cards the pending look shows to p1. */
export const looking = (g: TestGame): string[] =>
  (project(g.state, 'p1') as unknown as { looking: { card: string }[] }).looking.map((c) => c.card);

/** Instances of a card id in a zone, in order. */
export const idsOf = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
  c: string,
) =>
  g
    .zone(p, zone)
    .filter((x) => x.card === c)
    .map((x) => x.instance);

/** True when the only decision pending is the plain Main Phase one. */
export const inMain = (g: TestGame): boolean => dec(g)?.kind === 'main';

/** Number of cards in a hand. */
export const handSize = (g: TestGame, p: 'p1' | 'p2'): number => g.zone(p, 'hand').length;
