/**
 * Constants and helpers for the OP-15 group 1 card tests. Every card below is a vanilla (or has no
 * script, so no effect) unless noted; every Leader's own effects are inert in these positions.
 */
import type { CardId, InstanceId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

/** Red Leader {Straw Hat Crew}: no East Blue, Fish-Man, Dressrosa or Rebecca. 5000 power. */
export const RED_LEADER = 'ST01-001';
/** {East Blue} Leader (Green), 5000 power, no script. */
export const EB_LEADER = 'OP03-021';
/** {Fish-Man} Leader (Green) [Hody Jones], 5000 power, no script. */
export const FISH_LEADER = 'OP06-020';
/** {Dressrosa} Leader [Rebecca] (Blue/Black), 5000 power, no script. */
export const REBECCA_OLD = 'OP04-039';
/** {Dressrosa} Leader [Kyros], not [Rebecca]. */
export const KYROS_LEADER = 'EB01-040';
/** [Rebecca] of OP15 (the script under test in OP15-039). */
export const REBECCA = 'OP15-039';
export { PLAIN_BLUE };

/** {East Blue} vanillas by cost: 1 / 3000, 5 / 7000, 6 / 8000. */
export const EB = { c1: 'OP03-023', c5: 'EB05-015', c6: 'OP04-023' } as const;
/** {Dressrosa} vanillas by cost: 2 / 4000, 3 / 5000, 5 / 6000, 7 / 9000. */
export const DR = { c2: 'OP01-076', c3: 'OP10-054', c5: 'EB03-030', c7: 'OP10-050' } as const;
/** A non-Dressrosa, non-East Blue Character of cost 3 (5000 power). */
export const PLAIN3 = 'OP02-077';
/** An Event with no script (cost 3, Draw 2): no East Blue, Dressrosa. */
export const EVENT = 'OP03-056';
/** A {Dressrosa} Event with no script (cost 1). */
export const DR_EVENT = 'OP04-095';
/** An {East Blue} Event with no script (cost 3). */
export const EB_EVENT = 'OP03-056';
/** A [Brook] Character (cost 4, 5000 power), no script. */
export const BROOK = 'OP02-040';
/** [Bobby Funk] (OP15-050): its own effect needs [Kelly Funk] and is irrelevant here. */
export const BOBBY = 'OP15-050';

const TEN = { active: 10, rested: 0 };

/** A position where p1 has 10 active DON!! and the Red Leader unless given. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game({ leader: RED_LEADER, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/** Lower `who`'s Leader by `n` power for this turn (a stand-in for an effect that did it). */
export function shrinkLeader(g: TestGame, who: 'p1' | 'p2', n: number, turn = 3): void {
  const target: InstanceId = g.leader(who);
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount: -n,
      duration: { kind: 'thisTurn', turn },
      controller: who === 'p1' ? 'p2' : 'p1',
    },
  }).state;
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
