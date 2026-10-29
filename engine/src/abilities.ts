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

/** Does an activate ability have this timing ([Main], [Counter], [Activate: Main])? */
export function hasTiming(ab: Ability, t: ActivateTiming): boolean {
  if (ab.kind !== 'activate') return false;
  return Array.isArray(ab.when) ? ab.when.includes(t) : ab.when === t;
}
