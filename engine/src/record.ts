/**
 * Game records (ARCHITECTURE §2.9, ADR 0004): versioned `{ start, actions }`, replayed live when the
 * versions match, plus per-turn snapshots so a record from another version can still be opened
 * read-only.
 */
import type {
  CardLookup,
  GameRecord,
  GameResult,
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
 * re-recorded deliberately when it changes. A record's scripts version is per game
 * (`scriptsVersionOf`: the scripts of the cards in that game, PLAN M6b-0), so scripting an unrelated
 * card leaves old records live; a golden re-record is allowed without an engine bump only when that
 * game's own scripts changed (golden.test.ts, review M4b-17).
 */
export const ENGINE_VERSION = '0.5.18';

export class RecordVersionMismatch extends Error {
  constructor(
    readonly record: GameRecord['versions'],
    readonly current: GameRecord['versions'] | null = null,
  ) {
    super(
      `Record was made with engine ${record.engine} / scripts ${record.scripts} / cards ` +
        `${record.cards}; this build is engine ${ENGINE_VERSION}` +
        (current ? ` / scripts ${current.scripts} / cards ${current.cards}` : '') +
        '. Open it read-only from its snapshots.',
    );
    this.name = 'RecordVersionMismatch';
  }
}

/**
 * True when this build's engine matches the record. The scripts and card data of the game's own
 * cards are checked in replay, once the game's cards are known.
 */
export function replayable(record: GameRecord): boolean {
  return record.versions.engine === ENGINE_VERSION;
}

/**
 * The scripts version of a game: a hash of the effect script (or its absence) of every card number
 * in it. Scripting or changing an unrelated card does not change it (PLAN M6b-0, risk 7).
 */
export function scriptsVersionOf(state: GameState): string {
  const s = state as unknown as State;
  const scripts = Object.keys(s.defs)
    .sort()
    .map((id) => [id, SCRIPTS[id] ?? null]);
  return 'scripts-' + hashString(JSON.stringify(scripts)).slice(0, 16);
}

const textReaders = new Map<string, boolean>();
/** Does this card's script filter on printed text (`hasBaseEffect`, `hasTiming`)? */
function scriptReadsText(id: string): boolean {
  let v = textReaders.get(id);
  if (v === undefined) {
    const sc = SCRIPTS[id];
    v = sc !== undefined && /"has(BaseEffect|Timing)"/.test(JSON.stringify(sc));
    textReaders.set(id, v);
  }
  return v;
}

/**
 * The card-data version of a game: a hash of the game fields of every card in it (ADR 0004).
 * Replay recomputes it from the lookup it is given, so a record made against other card data is
 * never replayed live (M2-07).
 */
export function cardsVersionOf(state: GameState): string {
  const s = state as unknown as State;
  const ids = Object.keys(s.defs).sort();
  // `baseEffect` and `printed` (G49) are the card text, which play reads only through a script's
  // `hasBaseEffect` or `hasTiming` filter. A game with such a script in it hashes them for every
  // card in it, so a text correction cannot change play unseen (W57-R8); every other game hashes as
  // before, so an old record stays live after an unrelated card is scripted or its text corrected.
  const readsText = ids.some((id) => scriptReadsText(id));
  const fields = ids.map((id) => {
    const { abilities: _a, baseEffect, printed, ...game } = s.defs[id]!;
    return readsText ? { ...game, baseEffect: baseEffect ?? null, printed: printed ?? null } : game;
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

/**
 * Where the game stood after the record's last action (M8-R8): the summary hash and the result.
 * Snapshots exist only at turn starts, so without this the last turn and the result of a record
 * are not checked. Additive: records written before it have none (`verifyReplay` then says so).
 */
export interface FinalState {
  /** Number of actions applied: must equal `actions.length`, or the record was cut. */
  actionIndex: number;
  hash: string;
  result: GameResult | null;
}

export type RecordWithSnapshots = GameRecord & { snapshots: TurnSnapshot[]; final?: FinalState };

/** The `final` of a record whose last action produced `state`. */
export function finalOf(state: GameState, actionIndex: number): FinalState {
  const s = state as unknown as State;
  return { actionIndex, hash: summaryHash(s), result: s.result };
}

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
    versions: {
      engine: ENGINE_VERSION,
      cards: cardsVersionOf(initial),
      scripts: scriptsVersionOf(initial),
    },
    start,
    actions: [],
    snapshots: [snapshot(initial, 0)],
    final: finalOf(initial, 0),
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
  return { ...record, actions, snapshots, final: finalOf(after, actions.length) };
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
  const current = {
    ...record.versions,
    cards: cardsVersionOf(step.state),
    scripts: scriptsVersionOf(step.state),
  };
  if (current.cards !== record.versions.cards || current.scripts !== record.versions.scripts)
    throw new RecordVersionMismatch(record.versions, current);
  const events = [...step.events];
  const n = Math.min(upTo ?? record.actions.length, record.actions.length);
  for (let i = 0; i < n; i++) {
    step = fns.reduce(step.state, record.actions[i]!);
    events.push(...step.events);
  }
  return { state: step.state, events };
}

/** Why `verifyReplay` could not vouch for a record. */
export type VerifyFailure =
  | { ok: false; reason: 'cards' | 'scripts' | 'error' | 'no-snapshots' }
  | {
      ok: false;
      reason: 'hash';
      turn: number;
      actionIndex: number;
      /**
       * Where it failed: a turn snapshot (default), the `final` state after the last action
       * (`final`: hash or result differs), or the record's length against its `final` (`length`: it
       * was cut or extended).
       */
      at?: 'turn' | 'final' | 'length';
    };

export type VerifyResult =
  | {
      ok: true;
      engineDiffers: boolean;
      /** False for a record with no `final`: only its turn snapshots were checked. */
      finalChecked: boolean;
    }
  | VerifyFailure;

/**
 * Does this build still play this record the way it was recorded? Unlike `replayWith`, an
 * ENGINE_VERSION string difference is not refused: the record is replayed from its start and the
 * state's summary hash is compared with every `TurnSnapshot.hash` at its `actionIndex`. If they all
 * match, an engine bump did not change this game and the record stays live (M8 plan). The game's
 * own card data and scripts versions must still match, so a re-scripted card is a failure with its
 * own reason. A record that carries a `final` (hash and result after its last action) must also
 * have exactly that many actions and end in that state, so a truncated record or one with a changed
 * last turn fails (M8-R8); an older record without it is verified on its snapshots only and the
 * result says so (`finalChecked: false`). Pure; it changes no hash and no replay.
 */
export function verifyReplayWith(
  fns: Starter,
  record: RecordWithSnapshots,
  cards: CardLookup,
): VerifyResult {
  if (!Array.isArray(record.snapshots) || record.snapshots.length === 0)
    return { ok: false, reason: 'no-snapshots' };
  let step: Step;
  try {
    step =
      'setup' in record.start
        ? fns.createGame({ ...record.start.setup, cards })
        : fns.createFromScenario({ ...record.start.scenario, cards });
  } catch {
    return { ok: false, reason: 'error' };
  }
  if (cardsVersionOf(step.state) !== record.versions.cards) return { ok: false, reason: 'cards' };
  if (scriptsVersionOf(step.state) !== record.versions.scripts)
    return { ok: false, reason: 'scripts' };
  const byIndex = new Map<number, TurnSnapshot[]>();
  for (const snap of record.snapshots) {
    const list = byIndex.get(snap.actionIndex);
    if (list) list.push(snap);
    else byIndex.set(snap.actionIndex, [snap]);
  }
  const final = record.final;
  if (final && final.actionIndex !== record.actions.length)
    return {
      ok: false,
      reason: 'hash',
      turn: record.snapshots.at(-1)?.turn ?? 0,
      actionIndex: record.actions.length,
      at: 'length',
    };
  const check = (index: number): VerifyFailure | null => {
    for (const snap of byIndex.get(index) ?? [])
      if (summaryHash(step.state as unknown as State) !== snap.hash)
        return { ok: false, reason: 'hash', turn: snap.turn, actionIndex: index };
    return null;
  };
  let bad = check(0);
  if (bad) return bad;
  for (let i = 0; i < record.actions.length; i++) {
    try {
      step = fns.reduce(step.state, record.actions[i]!);
    } catch {
      return { ok: false, reason: 'error' };
    }
    bad = check(i + 1);
    if (bad) return bad;
  }
  // A snapshot past the last action cannot be matched: the record is not what it says.
  for (const idx of byIndex.keys())
    if (idx > record.actions.length) return { ok: false, reason: 'error' };
  if (final) {
    const now = finalOf(step.state, record.actions.length);
    if (now.hash !== final.hash || JSON.stringify(now.result) !== JSON.stringify(final.result))
      return {
        ok: false,
        reason: 'hash',
        turn: (step.state as unknown as State).turn,
        actionIndex: record.actions.length,
        at: 'final',
      };
  }
  return {
    ok: true,
    engineDiffers: record.versions.engine !== ENGINE_VERSION,
    finalChecked: final !== undefined,
  };
}
