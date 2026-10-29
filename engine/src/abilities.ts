/**
 * The engine's hook-facing ability shape. It follows the field names of the DSL sketch
 * (effect-dsl.md §4.14: `kind`, `when`, `oncePerTurn`, `optional`, `replaces`, `instead`) so the M4
 * interpreter can slot in behind the same hooks. The DSL itself is **not** implemented here: until
 * M4, an ability's effect is a list of internal steps that call atomic operations directly, and
 * only tests create abilities (`engine/src/testing.ts`).
 */
import type { InstanceId } from './api.ts';

export type AutoTiming =
  | 'startOfGame'
  | 'startOfYourTurn'
  | 'startOfMainPhase'
  | 'onPlay'
  | 'whenAttacking'
  | 'onOpponentAttack'
  | 'onBlock'
  | 'endOfBattle'
  | 'onKO'
  | 'endOfYourTurn'
  | 'endOfOpponentsTurn';

/** Internal effect steps (not the DSL). Each one calls an atomic operation. */
export type InternalStep =
  | { op: 'emit'; label: string }
  | { op: 'draw'; n: number }
  | { op: 'lifeToHand'; n: number }
  | { op: 'damage'; n: number; player: 'you' | 'opponent' }
  | { op: 'ko'; target: InstanceId }
  | { op: 'setActive'; target: 'self' };

/** Which K.O. a replacement watches: a card of `owner` (relative to the ability's controller). */
export interface KoMatch {
  owner: 'you' | 'opponent' | 'any';
  /** Exact card name (CR 2-1-2). */
  name?: string;
  /** Only this ability's own card. */
  self?: boolean;
}

interface Base {
  id: string;
  oncePerTurn?: true;
}

export type Ability =
  | (Base & { kind: 'auto'; when: AutoTiming[]; optional?: true; effect: InternalStep[] })
  | (Base & { kind: 'activate'; when: 'activateMain' | 'main'; effect: InternalStep[] })
  | (Base & { kind: 'trigger'; effect: InternalStep[] })
  | (Base & {
      kind: 'replacement';
      replaces: { ko: KoMatch };
      optional: boolean;
      instead: InternalStep[];
    });
