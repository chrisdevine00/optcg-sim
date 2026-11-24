/**
 * Constants and helpers for the EB-03 group 2 card tests. Every constant is a vanilla, or a card
 * whose text is unscripted (so inert) where the test puts it.
 */
import type { InstanceId } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec } from './helpers.ts';

export { mk, RED_LEADER, EVENT } from './helpers-op15g1.ts';
export { finishOrder } from './helpers-luffyace.ts';
export { canPick } from './helpers-w3s.ts';

/** Navy vanilla Character (EB02-034, Purple, cost 4, {Navy}{Foxy Pirates}). */
export const NAVY = 'EB02-034';
/** {SWORD} vanillas: cost 6 / 7000 (X.Drake) and cost 8 / 9000 (Koby, [On Play] only). */
export const SWORD6 = 'OP11-017';
export const SWORD8 = 'OP11-119';
/** {Revolutionary Army} Leader (Sabo, Red/Black; its text is unscripted). */
export const RA_LEADER = 'OP05-001';
/** {Revolutionary Army} Characters: [Koala] cost 2, cost 4 (Sabo), cost 6 (Inazuma), cost 7 (Kuma). */
export const KOALA2 = 'EB05-041';
export const RA4 = 'EB02-002';
export const RA6 = 'EB01-022';
export const RA7 = 'EB04-054';
/** [Nico Robin]: cost 1 (OP05-010), cost 7 (EB03-055). */
export const ROBIN1 = 'OP05-010';
export const ROBIN7 = 'EB03-055';
/** {CP} cards (cost 4 / 5 / 3 / 2). */
export const CP4 = 'OP03-082';
export const CP5 = 'OP03-085';
export const CP3 = 'OP03-087';
export const CP2 = 'OP03-084';
/** [Onigashima Island] (Stage, cost 3). */
export const ONIGASHIMA = 'ST04-017';
/** {Dressrosa} Stage, cost 1 (Corrida Coliseum); a non-{Dressrosa} Stage, cost 1; a {Dressrosa} Character. */
export const DR_STAGE1 = 'OP04-096';
export const STAGE1 = 'EB01-011';
export const DR_CHAR = 'OP01-076';
/** {Thriller Bark Pirates}: Leader [Perona]; Characters cost 2 / 4 / 6 / 8. */
export const PERONA_LEADER = 'OP06-021';
export const TBP2 = 'OP06-087';
export const TBP4 = 'ST12-005';
export const TBP4B = 'OP06-094';
export const TBP6 = 'OP16-105';
export const TBP8 = 'OP14-101';
/** {Sky Island} vanillas (cost 3, 5000 / cost 6, 8000) and {Neptunian} (cost 6, 8000). */
export const SKY3 = 'OP05-110';
export const SKY6 = 'OP08-099';
export const NEPT6 = 'OP11-026';
/** {FILM} vanillas: cost 3 (Schneider-like), cost 4 (Bins). */
export const FILM4 = 'ST05-013';
export const FILM3 = 'ST05-012';
/** {GERMA 66} vanilla, cost 5 (Vinsmoke Niji). */
export const GERMA5 = 'OP11-045';
/** {ODYSSEY} Leader (Lim, Green/Purple) and an {ODYSSEY} vanilla Character (cost 4, 6000). */
export const ODYSSEY_LEADER = 'OP09-022';
export const ODYSSEY4 = 'OP09-038';
/** [Vegapunk] Leader {Egghead}; [Nami] Leader; [Shirahoshi] Leader. */
export const VEGAPUNK_LEADER = 'OP07-097';
export const NAMI_LEADER = 'OP03-040';
export const SHIRAHOSHI_LEADER = 'OP11-022';
/** Characters with a [Trigger] (cost 4) and a vanilla without one (cost 4). */
export const TRIG4 = 'EB02-055';
export const COST8 = 'EB02-004';
/** Other [Trafalgar Law] cards: cost 1 (OP09-069), cost 5 (EB02-045), cost 7 (OP10-119). */
export const LAW1 = 'OP09-069';
export const LAW7 = 'OP10-119';
/** [Monkey.D.Luffy] Character (cost 4, 6000). */
export const LUFFY_C = 'P-022';

/** Add `amount` to `target`'s cost for this turn (a stand-in for an effect that did it). */
export function costMod(g: TestGame, target: InstanceId, amount: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target,
      amount,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

/** Instances (in order) of the cards in a player's zone. */
export const cardsIn = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** True when no decision other than the plain main-phase one is pending. */
export const inMain = (g: TestGame): boolean => dec(g)?.kind === 'main';
