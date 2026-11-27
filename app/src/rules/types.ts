/**
 * M9 WP0: the rules reference's contracts (docs/design/m9-plan.md, WP5). Entries are parsed at build
 * from `docs/research/rules-digest.md` and `rulings.md`; a demo is a scenario plus ordered steps that a
 * test replays on the real engine. Types only.
 */
import type { ScenarioJson } from '@optcg/ai';

export interface RuleEntry {
  /** `cr/7-1-4-1` is the route form of a CR number; entries are keyed `item/17` (digest) or `RL-18` (ruling). */
  id: string;
  kind: 'digest' | 'ruling';
  /** Section letter and title for a digest item; the ruling's family for a ruling. */
  section: string;
  title: string;
  /** Our paraphrase; `[engine note]` clauses and the `Engine test` paragraph are removed. */
  text: string;
  /** Every `CR x-y-z` and `item N` cited, as `7-1-4-1` and `item/17`. */
  cr: string[];
  confidence?: 'official explicit' | 'official by inference' | 'unresolved';
  /** WP5, additive. A ruling's confidence line when it says more than the label (`(reveal handling)`). */
  confidenceNote?: string;
  /** WP5, additive. A ruling's question, in our words; `text` is its answer. */
  question?: string;
  sources: string[];
  /** The id of the demo that shows this entry, when there is one. */
  demo?: string;
}

/** A card or Leader on one side, by printed id, resolved against a `GameState` (test) or `ProjectedView` (UI). */
export type Ref = { card: string; side: 'me' | 'opp' } | { leader: 'me' | 'opp' };

/** An engine action described by what it names, never by instance id. Absent fields match anything. */
export interface ActionPattern {
  type:
    | 'chooseFirst'
    | 'mulligan'
    | 'playCard'
    | 'giveDon'
    | 'activate'
    | 'attack'
    | 'endTurn'
    | 'block'
    | 'counter'
    | 'endCounter'
    | 'trigger'
    | 'optional'
    | 'pick'
    | 'done';
  /** Who acts; default `me`. A step by `opp` is played by the scripted opponent. */
  by?: 'me' | 'opp';
  card?: Ref;
  target?: Ref;
  attacker?: Ref;
  /** A Blocker, or `none` for declining to block. */
  blocker?: Ref | 'none';
  choice?: Ref;
  /** WP5, additive. A named option of a `choose` decision (`{ option: '2' }`). */
  option?: string;
  /** WP5, additive. A DON!! picked by where it is: `costActive` or `costRested`. */
  don?: 'costActive' | 'costRested';
  ability?: string;
  redraw?: boolean;
  accept?: boolean;
  activate?: boolean;
  goFirst?: boolean;
}

export interface DemoStep {
  /** What to do, in our words: "Attack their Leader with Zoro". Shown beside the board. */
  desc: string;
  match: ActionPattern;
}

/** `don` is the DON!! cards in the cost area (active and rested); `donDeck` is the DON!! deck (WP5, additive). */
export type DemoZone =
  'hand' | 'trash' | 'characters' | 'life' | 'stage' | 'deck' | 'don' | 'donDeck';

/** A fact about the final state, evaluated with the engine's own `queries` and `derive`. */
export type DemoExpect =
  | { kind: 'life'; side: 'me' | 'opp'; count: number }
  | { kind: 'zone'; side: 'me' | 'opp'; zone: DemoZone; count: number; card?: string }
  | { kind: 'power'; of: Ref; value: number }
  | { kind: 'rested'; of: Ref; rested: boolean }
  | { kind: 'result'; winner: 'me' | 'opp' | null }
  /**
   * WP5, additive. Whether an engine action matching `pattern` is legal for its seat: at the end of
   * the line, or after `afterStep` steps of it.
   */
  | { kind: 'legal'; pattern: ActionPattern; legal: boolean; afterStep?: number };

export interface RuleDemo {
  id: string;
  title: string;
  /** Rule ids that must exist in the parsed digest: `7-1-4-1`, `item/17`. */
  rules: string[];
  /** Ruling ids: `RL-18`. */
  rulings?: string[];
  /** A `Lesson.id` or code (`L25`) this demo supports. */
  lesson?: string;
  scenario: ScenarioJson;
  /** WP5, additive. Facts about the start position (the attack the demo says is impossible is not legal). */
  before?: DemoExpect[];
  line: DemoStep[];
  expect: DemoExpect[];
  /** Two sentences, our words. */
  say: [string, string];
  goal: string;
}
