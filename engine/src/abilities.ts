/**
 * The engine's ability shape: the DSL's (`@optcg/cards`, effect-dsl.md §4.14), widened in two ways
 * that never appear in a card script:
 * - two engine-only timing points (`startOfMainPhase`, `endOfBattle`) used by rule tests;
 * - `InternalStep`, a test-only step that calls one atomic operation directly. M2 tests inject
 *   these through `engine/src/testing.ts` to exercise the hooks without a script.
 */
import type {
  ActivateTiming,
  AutoTiming as DslAutoTiming,
  Condition,
  Continuous,
  Cost,
  ReplaceEvent,
  Step,
} from '@optcg/cards';
import type { InstanceId } from './api.ts';

export type AutoTiming = DslAutoTiming | 'startOfMainPhase' | 'endOfBattle';

/** Test-only steps (not the DSL). Each one calls an atomic operation. */
export type InternalStep =
  | { op: 'emit'; label: string }
  | { op: 'draw'; n: number }
  | { op: 'lifeToHand'; n: number }
  | { op: 'damage'; n: number; player: 'you' | 'opponent' }
  | { op: 'ko'; target: InstanceId }
  | { op: 'setActive'; target: 'self' };

/** A step of an ability's effect: a DSL step, or (tests only) an internal step. */
export type EStep = Step | InternalStep;

interface Base {
  id: string;
  label?: string;
  oncePerTurn?: true;
  conditions?: Condition[];
}

export type Ability =
  | (Base & { kind: 'auto'; when: AutoTiming[]; optional?: true; cost?: Cost[]; effect: EStep[] })
  | (Base & {
      kind: 'activate';
      when: ActivateTiming | ActivateTiming[];
      cost?: Cost[];
      costOptional?: true;
      effect: EStep[];
    })
  | (Base & { kind: 'trigger'; cost?: Cost[]; effect: EStep[] })
  | (Base & { kind: 'permanent'; zone?: 'field' | 'hand'; apply: Continuous[] })
  | (Base & {
      kind: 'replacement';
      replaces: ReplaceEvent;
      optional: boolean;
      instead: Cost[] | EStep[];
    });

export const isInternal = (s: unknown): s is InternalStep =>
  !!s && typeof s === 'object' && 'op' in s;

/**
 * Is this Event ability's activation cost optional, so that playing the card and paying the cost are
 * separate (CR 8-3-1-4)? Either the script says "you may" (`costOptional`, B-1), or the cost holds a
 * DON!! −X, whose reminder text reads "You may return …" (QA-ST01–04 ST04-016: an Event with
 * DON!! −1 can be activated without paying it, and nothing happens; M4a-08).
 */
export function optionalCost(ab: Ability): boolean {
  if (ab.kind !== 'activate' || !ab.cost?.length) return false;
  if (ab.costOptional) return true;
  const event = hasTiming(ab, 'main') || hasTiming(ab, 'counter');
  return event && ab.cost.some((c) => 'donMinus' in c);
}

/** Does an activate ability have this timing ([Main], [Counter], [Activate: Main])? */
export function hasTiming(ab: Ability, t: ActivateTiming): boolean {
  if (ab.kind !== 'activate') return false;
  return Array.isArray(ab.when) ? ab.when.includes(t) : ab.when === t;
}
