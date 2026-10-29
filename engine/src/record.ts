/**
 * Game records (ARCHITECTURE §2.9, ADR 0004): versioned `{ start, actions }`, replayed live when the
 * versions match, plus per-turn snapshots so a record from another version can still be opened
 * read-only.
 */
import type {
  CardLookup,
  GameRecord,
  GameSetup,
  GameState,
  PlayerId,
  ScenarioSpec,
  Step,
} from './api.ts';
import { project, type ProjectedView } from './project.ts';
import { hashString, summaryHash } from './hash.ts';
import { SCRIPTS } from '@optcg/cards';
import type { State } from './state.ts';

/**
 * Bump `ENGINE_VERSION` whenever a change alters how any recorded game plays out. Golden records are
 * re-recorded deliberately when it changes. `SCRIPTS_VERSION` is the effect-script hash (none until M4).
 */
export const ENGINE_VERSION = '0.5.2';
export const SCRIPTS_VERSION = 'scripts-' + hashString(JSON.stringify(SCRIPTS)).slice(0, 16);

export class RecordVersionMismatch extends Error {
  constructor(
    readonly record: GameRecord['versions'],
    readonly current: GameRecord['versions'] | null = null,
  ) {
    super(
      `Record was made with engine ${record.engine} / scripts ${record.scripts} / cards ` +
        `${record.cards}; this build is engine ${ENGINE_VERSION} / scripts ${SCRIPTS_VERSION}` +
        (current ? ` / cards ${current.cards}` : '') +
        '. Open it read-only from its snapshots.',
    );
    this.name = 'RecordVersionMismatch';
  }
}

/** True when this build's engine and scripts match the record (the cards are checked in replay). */
export function replayable(record: GameRecord): boolean {
  return record.versions.engine === ENGINE_VERSION && record.versions.scripts === SCRIPTS_VERSION;
}

/**
 * The card-data version of a game: a hash of the game fields of every card in it (ADR 0004).
 * Replay recomputes it from the lookup it is given, so a record made against other card data is
 * never replayed live (M2-07).
 */
export function cardsVersionOf(state: GameState): string {
  const s = state as unknown as State;
  const fields = Object.keys(s.defs)
    .sort()
    .map((id) => {
      const { abilities: _a, ...game } = s.defs[id]!;
      return game;
    });
  return 'cards-' + hashString(JSON.stringify(fields)).slice(0, 16);
}

/** A projected-for-both summary at a turn boundary (ARCHITECTURE §2.9). */
export interface TurnSnapshot {
  turn: number;
  /** Number of actions applied when the snapshot was taken. */
  actionIndex: number;
  hash: string;
  views: Record<PlayerId, ProjectedView>;
}

export type RecordWithSnapshots = GameRecord & { snapshots: TurnSnapshot[] };

function snapshot(state: GameState, actionIndex: number): TurnSnapshot {
  const s = state as unknown as State;
  return {
    turn: s.turn,
    actionIndex,
    hash: summaryHash(s),
    views: { p1: project(s, 'p1'), p2: project(s, 'p2') },
  };
}

/** Start a record from the state that `createGame` or `createFromScenario` returned. */
export function startRecord(start: GameRecord['start'], initial: GameState): RecordWithSnapshots {
  return {
    versions: { engine: ENGINE_VERSION, cards: cardsVersionOf(initial), scripts: SCRIPTS_VERSION },
    start,
    actions: [],
    snapshots: [snapshot(initial, 0)],
  };
}

/** Append an action and, at a turn boundary or the game's end, a snapshot. Pure. */
export function appendAction(
  record: RecordWithSnapshots,
  action: GameRecord['actions'][number],
  after: GameState,
): RecordWithSnapshots {
  const actions = [...record.actions, action];
  const s = after as unknown as State;
  const last = record.snapshots.at(-1);
  const snapshots =
    !last || last.turn !== s.turn || s.result !== null
      ? [...record.snapshots, snapshot(after, actions.length)]
      : record.snapshots;
  return { ...record, actions, snapshots };
}

export interface Starter {
  createGame: (setup: GameSetup) => Step;
  createFromScenario: (spec: ScenarioSpec) => Step;
  reduce: (state: GameState, action: GameRecord['actions'][number]) => Step;
}

export function replayWith(
  fns: Starter,
  record: GameRecord,
  cards: CardLookup,
  upTo?: number,
): Step {
  if (!replayable(record)) throw new RecordVersionMismatch(record.versions);
  let step =
    'setup' in record.start
      ? fns.createGame({ ...record.start.setup, cards })
      : fns.createFromScenario({ ...record.start.scenario, cards });
  const current = cardsVersionOf(step.state);
  if (current !== record.versions.cards)
    throw new RecordVersionMismatch(record.versions, { ...record.versions, cards: current });
  const events = [...step.events];
  const n = Math.min(upTo ?? record.actions.length, record.actions.length);
  for (let i = 0; i < n; i++) {
    step = fns.reduce(step.state, record.actions[i]!);
    events.push(...step.events);
  }
  return { state: step.state, events };
}
