/**
 * M9 WP0: the contracts of the drills (docs/design/m9-plan.md). Banks, judges, the drill shell and the
 * review's flag-to-puzzle path are written against these types. Items hold card ids only (no art);
 * everything judged `any-hand` is built from the player's own view and public facts, never a recorded
 * opponent hand (the label `hindsight` marks the one case that is).
 */
import type { Action, ScenarioSpec } from '@optcg/engine';
import type { Explanation } from '../../explanation.ts';

export type DrillId = 'mulligan' | 'lethal' | 'counter' | 'don';
export const DRILL_IDS: readonly DrillId[] = ['mulligan', 'lethal', 'counter', 'don'];

export type ItemSource =
  { kind: 'bank'; seed: number } | { kind: 'flag'; gameId: string; flagId: string; turn: number };

export interface ItemBase {
  id: string;
  drill: DrillId;
  /** `L12-mulligan`: a `Lesson.id`. */
  lesson: string;
  source: ItemSource;
  /** Leader ids; `mine` is the seat the player sits in. */
  mine: string;
  theirs: string | null;
  first: boolean;
  certainty: Explanation['certainty'];
  /** `guide` for mulligan items (label from `certaintyLabel(.., 'guide')`). */
  label: 'guide' | 'any-hand' | 'hindsight' | 'best-found';
}

export interface MulliganItem extends ItemBase {
  drill: 'mulligan';
  hand: string[];
  archetypeId: string;
}

/** A described board position, without the card lookup: committed as JSON. */
export type ScenarioJson = Omit<ScenarioSpec, 'cards'>;

export interface BoardItem extends ItemBase {
  drill: 'lethal' | 'counter' | 'don';
  scenario: ScenarioJson;
  /** The seat the player sits in; absent means `p1` (every bank item). Items from a played game keep the player's own seat. */
  seat?: 'p1' | 'p2';
  /** Engine actions applied after the start (the attack declared, the block step passed). */
  prefix: Action[];
  /** `harder`: the opponent's hand is `harderHand` from the public prior; `real`: the recorded hand. */
  hand: 'harder' | 'real';
}

export interface LethalItem extends BoardItem {
  drill: 'lethal';
  answer:
    | { lethal: true; actions: Action[]; line: string[] }
    | { lethal: false; reason: 'attackers' | 'bound' };
}

export interface CounterItem extends BoardItem {
  drill: 'counter';
  expect: 'counter' | 'take';
  judge: 'survive-turn' | 'no-counter-on-attack';
  detector: 'should-counter' | 'counter-wasted-a' | 'counter-wasted-b';
}

export interface DonLine {
  id: string;
  /** "Play Yamato (5), give 1 DON!! to your Leader, attack" */
  label: string;
  actions: Action[];
  unused: number;
}

export interface DonItem extends BoardItem {
  drill: 'don';
  lines: DonLine[];
  /** The ids of the lines with the least unused DON!!. */
  best: string[];
  /** The OP13-001 class: the best line keeps DON!! held on purpose (E07). */
  hold: boolean;
}

export type DrillItem = MulliganItem | LethalItem | CounterItem | DonItem;

export interface DrillBank {
  drill: DrillId;
  builtWith: { engine: string; scripts: string };
  items: DrillItem[];
}

/** Every committed bank holds at least this many items (done criteria, PLAN §2). */
export const MIN_BANK = 20;

/** One answered item, as the drill shell records it. */
export interface AnswerResult {
  itemId: string;
  correct: boolean;
  /** "Show answer" was used: the item counts as shown, not correct. */
  shownAnswer: boolean;
  /** Milliseconds from showing the item to answering; null when untimed or not measured. */
  ms: number | null;
}
