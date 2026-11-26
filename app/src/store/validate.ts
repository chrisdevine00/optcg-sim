/**
 * Hand-written validators for everything that comes from outside the store: an imported export file
 * (untrusted, M8 WP5) and, through `sanitizeReview`, what is written for a review. They build new
 * objects field by field, so an unknown field is dropped and nothing a file says can reach a
 * prototype. Strings are only ever rendered as React text. Nothing here touches the network.
 *
 * What this checks is shape and size, not play: whether a game's record still replays is the
 * engine's call (`verifyReplay`, `staleness.ts`), and a record that does not replay opens read-only.
 */
import type {
  AiTier,
  Evidence,
  Explanation,
  FlagKind,
  Move,
  PracticedState,
  ReviewFlag,
} from '@optcg/ai';
import type { ReviewMarker, TurnResult } from '@optcg/ai';
import type { SessionRecord } from '../session/index.ts';
import type { TutorialTimingLog } from '../tutorial/types.ts';
import {
  EXPORT_SCHEMA,
  MAX_GAMES,
  type ExportBundle,
  type GameMeta,
  type StoredGame,
  type StoredReview,
} from './types.ts';

/**
 * The AI tiers a stored game may name. A local copy, not a value import from `@optcg/ai`: that
 * barrel pulls the engine and the search into the initial bundle (the store boots before first
 * render). `app/test/store-import.test.ts` checks it equals `AI_TIERS`.
 */
export const STORED_TIERS: readonly AiTier[] = ['rookie', 'pirate', 'warlord', 'emperor'];

export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
export const MAX_ACTIONS = 20_000;
export const MAX_SNAPSHOTS = 2_000;
const MAX_DEPTH = 24;
const MAX_NODES = 2_000_000;
const MAX_TEXT = 20_000;
const MAX_TIMING_RUNS = 100;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const ID_RE = /^[A-Za-z0-9._-]{1,80}$/;

/** Counts nodes across one whole validation, so a hostile file cannot make it run for long. */
class Budget {
  nodes = 0;
  take(): boolean {
    return ++this.nodes <= MAX_NODES;
  }
}

class Invalid extends Error {}
const bad = (why: string): never => {
  throw new Invalid(why);
};

function str(v: unknown, what: string, max = 200): string {
  if (typeof v !== 'string' || v.length > max) return bad(`${what} is not a short text`);
  return v;
}
function int(v: unknown, what: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max)
    return bad(`${what} is not a whole number in range`);
  return v;
}
function oneOf<T extends string>(v: unknown, what: string, allowed: readonly T[]): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v))
    return bad(`${what} is not an allowed value`);
  return v as T;
}
function arr(v: unknown, what: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max) return bad(`${what} is not a list of a sane size`);
  return v;
}
function obj(v: unknown, what: string): Rec {
  if (!isObj(v)) return bad(`${what} is not an object`);
  return v;
}

/** A deep copy of plain JSON data (objects, lists, text, finite numbers, booleans, null). */
function json(v: unknown, b: Budget, what: string, depth = 0): unknown {
  if (!b.take() || depth > MAX_DEPTH) return bad(`${what} is too large or too deep`);
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : bad(`${what} has a non-finite number`);
  if (typeof v === 'string') return v.length <= 100_000 ? v : bad(`${what} has a very long text`);
  if (Array.isArray(v)) return v.map((x) => json(x, b, what, depth + 1));
  if (isObj(v)) {
    const out: Rec = {};
    for (const [k, x] of Object.entries(v)) {
      if (BAD_KEYS.has(k)) continue;
      out[k] = json(x, b, what, depth + 1);
    }
    return out;
  }
  return bad(`${what} has something that is not data`);
}

// --- explanations and flags ---------------------------------------------------------------------

const MOVE_KINDS: Move['kind'][] = [
  'play',
  'giveDon',
  'activate',
  'attack',
  'block',
  'counter',
  'take',
  'choose',
  'trigger',
  'keep',
  'redraw',
  'endTurn',
];

function move(v: unknown): Move {
  const o = obj(v, 'a move');
  const m: Move = {
    kind: oneOf(o.kind, 'a move kind', MOVE_KINDS),
    text: str(o.text, 'a move text', MAX_TEXT),
  };
  if (o.card !== undefined) m.card = str(o.card, 'a move card', 100);
  if (o.target !== undefined) m.target = str(o.target, 'a move target', 100);
  if (o.count !== undefined) m.count = int(o.count, 'a move count', -1e6, 1e6);
  return m;
}

function evidence(v: unknown): Evidence {
  const o = obj(v, 'evidence');
  const e: Evidence = { text: str(o.text, 'evidence text', MAX_TEXT) };
  if (o.figures !== undefined) {
    const figs: Record<string, number> = {};
    for (const [k, x] of Object.entries(obj(o.figures, 'figures'))) {
      if (BAD_KEYS.has(k)) continue;
      if (typeof x !== 'number' || !Number.isFinite(x)) return bad('a figure is not a number');
      figs[str(k, 'a figure name', 80)] = x;
    }
    e.figures = figs;
  }
  return e;
}

const CERTAINTY: Explanation['certainty'][] = [
  'any-hand',
  'needed-hidden-info',
  'search-incomplete',
];

export function sanitizeExplanation(v: unknown): Explanation {
  const o = obj(v, 'an explanation');
  return {
    conceptId: str(o.conceptId, 'conceptId', 100),
    claim: str(o.claim, 'claim', MAX_TEXT),
    evidence: arr(o.evidence, 'evidence', 100).map(evidence),
    line: o.line === null ? null : arr(o.line, 'a line', 200).map(move),
    outcome: str(o.outcome, 'outcome', MAX_TEXT),
    certainty: oneOf(o.certainty, 'certainty', CERTAINTY),
    nextTime: str(o.nextTime, 'nextTime', MAX_TEXT),
    lessonId: str(o.lessonId, 'lessonId', 100),
    sources: arr(o.sources, 'sources', 50).map((s) => str(s, 'a source', 300)),
  };
}

const KINDS: FlagKind[] = [
  'missed-lethal',
  'given-away',
  'don-unused',
  'counter-wasted',
  'should-counter',
  'target',
  'mulligan',
];

function flag(v: unknown): ReviewFlag {
  const o = obj(v, 'a flag');
  const f: ReviewFlag = {
    id: str(o.id, 'a flag id', 100),
    kind: oneOf(o.kind, 'a flag kind', KINDS),
    turn: int(o.turn, 'a flag turn', 0, 10_000),
    player: oneOf(o.player, 'a player', ['p1', 'p2'] as const),
    restoreIndex: int(o.restoreIndex, 'restoreIndex', 0, MAX_ACTIONS),
    decisionIndex: int(o.decisionIndex, 'decisionIndex', 0, MAX_ACTIONS),
    severity: oneOf(o.severity, 'severity', ['severe', 'moderate', 'minor', 'hindsight'] as const),
    certainty: oneOf(o.certainty, 'a flag certainty', CERTAINTY),
    explanation: sanitizeExplanation(o.explanation),
    did: arr(o.did, 'did', 200).map(move),
  };
  if (o.practice !== undefined) {
    const p = obj(o.practice, 'practice');
    f.practice = {
      judge: oneOf(p.judge, 'a judge', [
        'win-this-turn',
        'survive-turn',
        'no-counter-on-attack',
      ] as const),
      turn: int(p.turn, 'a practice turn', 0, 10_000),
    };
  }
  return f;
}

function marker(v: unknown): ReviewMarker {
  const o = obj(v, 'a marker');
  const m: ReviewMarker = {
    turn: int(o.turn, 'a marker turn', 0, 10_000),
    kind: o.kind === null ? null : oneOf(o.kind, 'a marker kind', KINDS),
    reason: oneOf(o.reason, 'a marker reason', [
      'search-incomplete',
      'deadline',
      'not-run',
    ] as const),
  };
  if (o.explanation !== undefined) m.explanation = sanitizeExplanation(o.explanation);
  return m;
}

function turnResult(v: unknown): TurnResult {
  const o = obj(v, 'a turn result');
  const r: TurnResult = {
    itemId: str(o.itemId, 'an item id', 120),
    turn: int(o.turn, 'a result turn', 0, 10_000),
    flags: arr(o.flags, 'flags', 500).map(flag),
    notes: arr(o.notes, 'notes', 100).map(sanitizeExplanation),
  };
  if (o.marker !== undefined) r.marker = marker(o.marker);
  return r;
}

/**
 * The review as it is stored: exactly the known fields, so a detector that attaches extra facts
 * cannot make the store heavy (WP5 "flags trimmed of heavy facts"). Throws on a malformed review.
 */
export function sanitizeReview(v: unknown): StoredReview {
  const o = obj(v, 'a review');
  const results: Record<string, TurnResult> = {};
  for (const [k, r] of Object.entries(obj(o.results, 'results'))) {
    if (BAD_KEYS.has(k)) continue;
    results[str(k, 'a result key', 120)] = turnResult(r);
  }
  const practised: Record<string, PracticedState> = {};
  for (const [k, s] of Object.entries(obj(o.practised ?? {}, 'practised'))) {
    if (BAD_KEYS.has(k)) continue;
    practised[str(k, 'a practised key', 120)] = oneOf(s, 'a practised state', [
      'solved',
      'not-yet',
    ] as const);
  }
  return {
    gameId: str(o.gameId, 'a review game id', 80),
    analysisVersion: int(o.analysisVersion, 'analysisVersion', 0, 1_000_000),
    engineVersion: str(o.engineVersion, 'engineVersion', 100),
    status: oneOf(o.status, 'a review status', ['running', 'partial', 'complete'] as const),
    results,
    markers: arr(o.markers, 'markers', 1000).map(marker),
    practised,
  };
}

// --- games --------------------------------------------------------------------------------------

function meta(v: unknown): GameMeta {
  const o = obj(v, 'game meta');
  const ver = obj(o.versions, 'versions');
  return {
    result: oneOf(o.result, 'a result', ['won', 'lost', 'draw'] as const),
    me: oneOf(o.me, 'a seat', ['p1', 'p2'] as const),
    myLeader: str(o.myLeader, 'myLeader', 100),
    opponentLeader: str(o.opponentLeader, 'opponentLeader', 100),
    tier: oneOf(o.tier, 'a tier', STORED_TIERS),
    deckName: str(o.deckName, 'deckName', 200),
    turns: int(o.turns, 'turns', 0, 10_000),
    endedAt: int(o.endedAt, 'endedAt', 0, 8_640_000_000_000_000),
    tags: arr(o.tags, 'tags', 20).map((t) => str(t, 'a tag', 60)),
    versions: {
      engine: str(ver.engine, 'engine version', 100),
      cards: str(ver.cards, 'cards version', 100),
      scripts: str(ver.scripts, 'scripts version', 100),
    },
  };
}

function action(v: unknown, b: Budget): unknown {
  const o = obj(v, 'an action');
  str(o.type, 'an action type', 60);
  return json(o, b, 'an action');
}

export function sanitizeRecord(v: unknown, b: Budget = new Budget()): SessionRecord {
  const o = obj(v, 'a record');
  const ver = obj(o.versions, 'record versions');
  const start = obj(o.start, 'record start');
  let cleanStart: Rec;
  if ('setup' in start) cleanStart = { setup: obj(json(start.setup, b, 'setup'), 'setup') };
  else if ('scenario' in start)
    cleanStart = { scenario: obj(json(start.scenario, b, 'scenario'), 'scenario') };
  else return bad('a record has no start');
  const actions = arr(o.actions, 'actions', MAX_ACTIONS).map((a) => action(a, b));
  const snapshots = arr(o.snapshots, 'snapshots', MAX_SNAPSHOTS).map((s) => {
    const sn = obj(s, 'a snapshot');
    const views = obj(sn.views, 'snapshot views');
    return {
      turn: int(sn.turn, 'a snapshot turn', 0, 10_000),
      actionIndex: int(sn.actionIndex, 'actionIndex', 0, actions.length),
      hash: str(sn.hash, 'a snapshot hash', 200),
      views: {
        p1: obj(json(views.p1, b, 'a snapshot view'), 'a snapshot view'),
        p2: obj(json(views.p2, b, 'a snapshot view'), 'a snapshot view'),
      },
    };
  });
  const seats = obj(o.seats, 'seats');
  const rewinds = arr(o.rewinds, 'rewinds', 500).map((r) => {
    const rw = obj(r, 'a rewind');
    return {
      from: int(rw.from, 'rewind from', 0, MAX_ACTIONS),
      to: int(rw.to, 'rewind to', 0, MAX_ACTIONS),
      undone: arr(rw.undone, 'undone', MAX_ACTIONS).map((a) => action(a, b)),
    };
  });
  return {
    versions: {
      engine: str(ver.engine, 'engine version', 100),
      cards: str(ver.cards, 'cards version', 100),
      scripts: str(ver.scripts, 'scripts version', 100),
    },
    start: cleanStart,
    actions,
    snapshots,
    seats: {
      p1: oneOf(seats.p1, 'a seat', ['human', 'ai'] as const),
      p2: oneOf(seats.p2, 'a seat', ['human', 'ai'] as const),
    },
    rewinds,
    auto: arr(o.auto, 'auto', MAX_ACTIONS).map((i) => int(i, 'an auto index', 0, MAX_ACTIONS)),
  } as unknown as SessionRecord;
}

export function sanitizeGame(v: unknown, b: Budget = new Budget()): StoredGame {
  const o = obj(v, 'a game');
  const id = str(o.id, 'a game id', 80);
  if (!ID_RE.test(id)) return bad('a game id has odd characters');
  return { id, meta: meta(o.meta), record: sanitizeRecord(o.record, b) };
}

// --- timing and progress ------------------------------------------------------------------------

export function sanitizeTimingLog(v: unknown): TutorialTimingLog {
  const o = obj(v, 'a timing run');
  if (o.schema !== 'tutorial-timing/1') return bad('a timing run has another schema');
  const s = obj(o.settings, 'timing settings');
  const nn = (x: unknown, what: string) => {
    if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 1e12)
      return bad(`${what} is not a time`);
    return x;
  };
  const count = (x: unknown, what: string) => int(x, what, 0, 1e9);
  return {
    schema: 'tutorial-timing/1',
    runId: str(o.runId, 'runId', 80),
    appVersion: str(o.appVersion, 'appVersion', 100),
    engineVersion: str(o.engineVersion, 'engineVersion', 100),
    tutorialVersion: str(o.tutorialVersion, 'tutorialVersion', 100),
    startedAt: str(o.startedAt, 'startedAt', 60),
    settings: {
      reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : false,
      aiPace: str(s.aiPace, 'aiPace', 40),
      singleKeyShortcuts: typeof s.singleKeyShortcuts === 'boolean' ? s.singleKeyShortcuts : false,
      cardAnnouncements: str(s.cardAnnouncements, 'cardAnnouncements', 40),
    },
    steps: arr(o.steps, 'steps', 200).map((x) => {
      const st = obj(x, 'a step');
      const inputs = obj(st.inputs, 'inputs');
      return {
        stepId: str(st.stepId, 'stepId', 80),
        enteredMs: nn(st.enteredMs, 'enteredMs'),
        completedMs: st.completedMs === null ? null : nn(st.completedMs, 'completedMs'),
        activeMs: nn(st.activeMs, 'activeMs'),
        hiddenMs: nn(st.hiddenMs, 'hiddenMs'),
        idleMs: nn(st.idleMs, 'idleMs'),
        blockedAttempts: count(st.blockedAttempts, 'blockedAttempts'),
        hintsOpened: count(st.hintsOpened, 'hintsOpened'),
        explainOpened: count(st.explainOpened, 'explainOpened'),
        rewinds: count(st.rewinds, 'rewinds'),
        inputs: {
          pointer: count(inputs.pointer, 'pointer'),
          keyboard: count(inputs.keyboard, 'keyboard'),
        },
        exits: count(st.exits, 'exits'),
      };
    }),
    completedMs: o.completedMs === null ? null : nn(o.completedMs, 'completedMs'),
    totalActiveMs: nn(o.totalActiveMs, 'totalActiveMs'),
    totalWallMs: nn(o.totalWallMs, 'totalWallMs'),
  };
}

export const LETHAL_KEY = 'lethal';
const TIERS_NEEDED = ['tier1', 'tier2', 'count', 'tier3'] as const;

export function sanitizeLethalProgress(
  v: unknown,
): { game: number; turn: number; furthest: (typeof TIERS_NEEDED)[number] }[] {
  return arr(v, 'lethal progress', 1000).map((x) => {
    const e = obj(x, 'a progress entry');
    return {
      game: int(e.game, 'game', -2_147_483_648, 4_294_967_295),
      turn: int(e.turn, 'turn', 0, 10_000),
      furthest: oneOf(e.furthest, 'furthest', TIERS_NEEDED),
    };
  });
}

// --- the bundle ---------------------------------------------------------------------------------

export type ParsedBundle =
  { ok: true; bundle: ExportBundle; skipped: string[] } | { ok: false; error: string };

/** The plain-words reasons, for the Settings → Data status line. */
export const IMPORT_ERRORS = {
  tooBig: 'That file is larger than 50 MB, so it was not read.',
  notJson: 'That file is not an OPTCG Sim export: it is not readable JSON.',
  notExport: 'That file is not an OPTCG Sim export.',
  newer: 'That export is from a newer version of OPTCG Sim than this one.',
} as const;

/**
 * Validates an export file's text. A bad file as a whole gives `ok: false`; a bad game, review,
 * timing run or progress key inside an otherwise good file is left out and listed in `skipped`, so
 * one damaged game does not lose the rest. Nothing is written here.
 */
export function parseExport(text: string, byteLength?: number): ParsedBundle {
  if ((byteLength ?? text.length) > MAX_IMPORT_BYTES)
    return { ok: false, error: IMPORT_ERRORS.tooBig };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: IMPORT_ERRORS.notJson };
  }
  return validateExport(raw);
}

export function validateExport(raw: unknown): ParsedBundle {
  if (!isObj(raw) || typeof raw.schema !== 'string')
    return { ok: false, error: IMPORT_ERRORS.notExport };
  if (raw.schema !== EXPORT_SCHEMA)
    return {
      ok: false,
      error: raw.schema.startsWith('optcg-sim/export/')
        ? IMPORT_ERRORS.newer
        : IMPORT_ERRORS.notExport,
    };
  const skipped: string[] = [];
  const skip = (what: string, e: unknown) => {
    if (skipped.length < 20)
      skipped.push(`${what}: ${e instanceof Invalid ? e.message : 'unreadable'}`);
  };
  try {
    const budget = new Budget();
    const bundle: ExportBundle = {
      schema: EXPORT_SCHEMA,
      exportedAt:
        typeof raw.exportedAt === 'number' && Number.isFinite(raw.exportedAt) ? raw.exportedAt : 0,
      build: typeof raw.build === 'string' ? raw.build.slice(0, 100) : '',
      games: [],
      reviews: [],
      timing: {},
      progress: {},
    };
    const games = Array.isArray(raw.games) ? raw.games : [];
    if (games.length > MAX_GAMES)
      skip('games', new Invalid(`more than ${MAX_GAMES} games; the rest are left out`));
    const ids = new Set<string>();
    games.slice(0, MAX_GAMES).forEach((g, i) => {
      try {
        const game = sanitizeGame(g, budget);
        if (ids.has(game.id)) throw new Invalid('a game id appears twice');
        ids.add(game.id);
        bundle.games.push(game);
      } catch (e) {
        skip(`game ${i + 1}`, e);
      }
    });
    (Array.isArray(raw.reviews) ? raw.reviews : []).slice(0, MAX_GAMES).forEach((r, i) => {
      try {
        const review = sanitizeReview(r);
        if (!ids.has(review.gameId)) throw new Invalid('its game is not in the file');
        if (bundle.reviews.some((x) => x.gameId === review.gameId))
          throw new Invalid('a review appears twice');
        bundle.reviews.push(review);
      } catch (e) {
        skip(`review ${i + 1}`, e);
      }
    });
    if (isObj(raw.timing)) {
      for (const [k, v] of Object.entries(raw.timing).slice(0, MAX_TIMING_RUNS)) {
        if (BAD_KEYS.has(k)) continue;
        try {
          const run = sanitizeTimingLog(v);
          bundle.timing[run.runId] = run;
        } catch (e) {
          skip('a timing run', e);
        }
      }
    }
    if (isObj(raw.progress) && raw.progress[LETHAL_KEY] !== undefined) {
      try {
        bundle.progress[LETHAL_KEY] = sanitizeLethalProgress(raw.progress[LETHAL_KEY]);
      } catch (e) {
        skip('lethal progress', e);
      }
    }
    return { ok: true, bundle, skipped };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: IMPORT_ERRORS.notExport };
    throw e;
  }
}
