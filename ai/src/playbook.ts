/**
 * Archetype playbooks (ARCHITECTURE §4.6): `ai/playbooks/<leader-id>.json`. Each one is written from
 * the archetype guide's "Game plan by turn" and "Playbook seeds" (`docs/content/archetypes/`), so the
 * Meta Explorer guide and the AI never disagree. A playbook biases the heuristic (weight multipliers,
 * card values, face-versus-board by stage) and the move choice (biases), and lists the game-plan
 * assertions the tests check.
 */
import rocks from '../playbooks/OP17-039.json';
import kaido from '../playbooks/OP17-058.json';

/** The heuristic terms a playbook can scale (see `search/heuristic.ts`). */
export type WeightKey = 'life' | 'hand' | 'counter' | 'board' | 'don' | 'threat';

/** A move bias. Bonuses are in heuristic units (about one card each). */
export type Bias =
  /** The AI's Leader (or a card) attacks, from the AI's own turn `fromOwnTurn`. */
  | {
      kind: 'attackWith';
      card: 'leader' | string;
      fromOwnTurn: number;
      bonus: number;
      seed: number;
    }
  /** Accept this optional ability ("you may") while the AI holds at least `minHand` cards. */
  | {
      kind: 'acceptOptional';
      source: string;
      ability: string;
      minHand: number;
      bonus: number;
      seed: number;
    }
  /** Play one of these cards, optionally only from or by an own turn. */
  | {
      kind: 'play';
      cards: string[];
      fromOwnTurn?: number;
      byOwnTurn?: number;
      bonus: number;
      seed: number;
    }
  /** Do not play `card` while `whileInHand` is in hand, from own turn `fromOwnTurn`. */
  | {
      kind: 'avoidPlay';
      card: string;
      whileInHand: string;
      fromOwnTurn: number;
      penalty: number;
      seed: number;
    }
  /** In this ability's target choice, prefer the opponent's Character with the highest power. */
  | { kind: 'targetHighestPower'; source: string; ability: string; bonus: number; seed: number }
  /**
   * On the opponent's attack, use this once-per-turn ability on their attacking Character when it
   * changes the battle (the attacker falls below the defender, or the Counter needed falls).
   */
  | { kind: 'useOnAttacker'; source: string; ability: string; bonus: number; seed: number }
  /**
   * Play `card` only after the Leader has attacked this turn (its [When Attacking] has had the
   * chance to shrink a target), when the opponent has a Character in the power window.
   */
  | {
      kind: 'playAfterLeaderAttack';
      card: string;
      targetPower: [number, number];
      penalty: number;
      seed: number;
    };

/** A measurable game-plan assertion (ARCHITECTURE §4.6), checked by the tests. */
export interface Assertion {
  /** The guide's playbook seed number. */
  seed: number;
  text: string;
  /** The share of qualifying situations that must satisfy it. */
  threshold: number;
  source: string;
}

export interface MulliganRule {
  /** Keep only with at least `min` Characters whose cost is within [costMin, costMax]... */
  early: { costMin: number; costMax: number; min: number };
  /** ...or at least one of these plan pieces (ramp, search). */
  planPieces: string[];
  /** Counter cards (Counter value or [Counter] Event) wanted. */
  minCounters: number;
  /** "Two yeses is a keep" (strategy-concepts §9, S9); going second, one fewer is enough. */
  yesesToKeep: number;
}

export interface LeaderTrickCopy {
  /** The ability's short name in copy ("−2000"). */
  name: string;
  claim: string;
  nextTime: string;
  lessonId: string;
  sources: string[];
}

export interface Playbook {
  leaderId: string;
  archetypeId: string;
  /** How explanations name this AI (explanations.md copy rules: by its Leader). */
  aiName: string;
  asOf: string;
  guide: string;
  /** Where each choice comes from. */
  notes?: string[];
  /** Turn order (strategy-concepts §10, S17). */
  goFirst: boolean;
  digTargets: string[];
  winConditions: string[];
  /** Extra value of a card on this AI's field, for its ongoing effect. */
  cardValue: Record<string, number>;
  weights: Partial<Record<WeightKey, number>>;
  /** Multiplier on the opponent's Life term by the AI's own turn: T1–2, T3–4, T5 on. */
  faceBias: { early: number; mid: number; late: number };
  /** Multiplier on the AI's own Life term: above 1 counters more readily. */
  counterAggression: number;
  mulligan: MulliganRule & { requireEarlyGoingFirst: boolean };
  biases: Bias[];
  assertions: Assertion[];
  /** The Leader's defensive trick, for "Why?" (explanations.md E16). */
  leaderTrick?: LeaderTrickCopy & { source: string; ability: string };
}

const ALL = [rocks, kaido] as unknown as Playbook[];

export const PLAYBOOKS: ReadonlyMap<string, Playbook> = new Map(ALL.map((p) => [p.leaderId, p]));

export function playbookFor(leaderId: string): Playbook | null {
  return PLAYBOOKS.get(leaderId) ?? null;
}

/** The AI's own turn count: T1 is its first turn (the guides count turns this way). */
export function ownTurn(turn: number, first: boolean): number {
  return first ? Math.ceil(turn / 2) : Math.floor(turn / 2);
}

/** Game stage for `faceBias`. */
export function stageOf(own: number): 'early' | 'mid' | 'late' {
  return own <= 2 ? 'early' : own <= 4 ? 'mid' : 'late';
}
