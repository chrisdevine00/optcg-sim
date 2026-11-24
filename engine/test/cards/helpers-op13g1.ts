/**
 * Constants and helpers for the OP-13 group 1 card tests. Every card below is a vanilla (or has no
 * script, so no effect) unless noted; every Leader's own effects are inert in these positions.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

export { PLAIN_BLUE };
/** [Monkey.D.Luffy] Leader (Red, {Straw Hat Crew}), 5000 power, no script. */
export const LUFFY_LEADER = 'ST01-001';
/** [Sabo] Leader {Revolutionary Army}, 5000 power, no script. */
export const SABO_LEADER = 'OP05-001';
/** [Portgas.D.Ace] Leader {Whitebeard Pirates}, 5000 power, no script. */
export const ACE_LEADER = 'OP03-001';
/** [Monkey.D.Luffy] Character (cost 3, 5000). */
export const LUFFY_CHAR = 'ST08-011';
/** [Portgas.D.Ace] Character (cost 4, 6000). */
export const ACE_CHAR = 'P-119';
/** {Revolutionary Army} vanillas: cost 2 / 4000 ([Koala]) and cost 5 / 6000. */
export const RA = { c2: 'EB05-041', c5: 'OP12-083' } as const;
/** {Mountain Bandits} [Dogura]: 2000 power, cost 1 (its Activate is unscripted, so inert). */
export const DOGURA = 'OP02-010';
/** {Alabasta} [Nefeltari Vivi] cost 2 / 4000; {Alabasta}{Straw Hat Crew} [Sanji] cost 1 / 3000. */
export const ALABASTA2 = 'ST01-009';
export const ALABASTA1 = 'OP04-007';
/** {FILM}{Straw Hat Crew} cost 2 / 4000; a cost 5 {Land of Wano} Character with neither type. */
export const SHC2 = 'OP02-033';
export const PLAIN5 = 'EB01-018';
/** A {Music} Event and a {FILM} Character with no script. */
export const MUSIC_EVENT = 'EB02-008';
export const FILM_CHAR = 'P-022';
/** 0 power ([OP13-014] Rouge, script is [Trigger] only) and 1000 power (OP13-007) Characters. */
export const ZERO_POWER = 'OP13-014';
export const ONE_THOUSAND = 'OP13-007';
/** 2000 base power Character with no script. */
export const P2000 = 'OP08-104';

const TEN = { active: 10, rested: 0 };

/** A position where p1 has 10 active DON!! and the Luffy Leader unless given. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game({ leader: LUFFY_LEADER, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/** Give `target` `n` power for turn `turn` (a stand-in for an effect that did it). */
export function boost(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount: n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

/** Instances of a card id in a zone, in order. */
export const all = (
  g: TestGame,
  p: 'p1' | 'p2',
  zone: Parameters<TestGame['zone']>[1],
  c: CardId,
) =>
  g
    .zone(p, zone)
    .filter((x) => x.card === c)
    .map((x) => x.instance);
