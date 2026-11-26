/**
 * Runs and keeps one game's review (M8 WP6): the analysis pool, its results as they arrive, and the
 * stored review (`ReviewStore`) behind it.
 *
 * - Opened with a complete stored review of this analysis version, it only reads it.
 * - A stored review that is partial (or none) is resumed: the analysis runs again and every result
 *   replaces the stored one of the same item id, so what was already known shows at once.
 * - A stale record (`live === false`) is never re-run: the stored review is all there is.
 * - `pause()` stops the pool (Play from here and Practice are on screen: the AI's own search gets
 *   the cores); `resume()` starts it again if the review was not complete.
 * - "Analyse now" before the end is `prioritise`; after the pool is idle it is a targeted run:
 *   the turn's items from `planReview` are re-run with `deeper` (outside the deadline).
 *
 * The review is saved as it goes (debounced) and at the end; a failed save never touches the screen.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '@optcg/cards';
import { ENGINE_VERSION, type PlayerId } from '@optcg/engine';
import {
  planReview,
  type FlagKind,
  type PracticedState,
  type ReviewMarker,
  type TurnResult,
} from '@optcg/ai';
import type { SessionRecord } from '../../session/index.ts';
import { getStore, type ReviewStore, type StoredReview } from '../../store/index.ts';
import { startReviewStream, type StreamRun } from './analyse.ts';
import { ANALYSIS_VERSION } from './model.ts';
import type { PoolHandlers, WorkerLike } from './pool.ts';

export { ANALYSIS_VERSION };
export type RunStatus = 'loading' | 'running' | 'paused' | 'done' | 'failed' | 'stored';

export interface Progress {
  done: number;
  total: number;
  turn: number;
  turns: number;
}

export interface ReviewRun {
  status: RunStatus;
  progress: Progress | null;
  results: Map<string, TurnResult>;
  /** The markers of the run's end ("deadline", "not-run"); those of results come with them. */
  extraMarkers: ReviewMarker[];
  practised: Record<string, PracticedState>;
  message: string | null;
  /** Turns a targeted run is working on (shown as in progress). */
  busyTurns: ReadonlySet<number>;
  prioritise(turn: number): void;
  /** Re-run the unfinished items of a turn ("Analyse now"), or a kind's with ten times the cap. */
  analyse(turn: number, opts?: { kind?: FlagKind | null; factor?: number }): void;
  pause(): void;
  resume(): void;
  /** Write "Practised: solved / not yet" to the review store. Solved is never undone by a miss. */
  markPractised(flagId: string, state: PracticedState): void;
}

export interface UseReviewInput {
  /** The saved game's id; null when the game could not be saved (nothing is stored then). */
  gameId: string | null;
  record: SessionRecord;
  cards: ReadonlyMap<string, Card>;
  seats: PlayerId[];
  /** Whether the record replays on this build (`liveness().live`); a stale one is never re-run. */
  live: boolean;
  /** The store; default the app's. */
  store?: () => ReviewStore;
  /** Tests: in-process workers. */
  createWorker?: () => WorkerLike;
  size?: number;
  nodes?: number;
  deadlineMs?: number;
  /** Tests: save without the debounce. */
  saveDelayMs?: number;
}

export function useReview(input: UseReviewInput): ReviewRun {
  const { gameId, live } = input;
  const storeOf = input.store ?? getStore;
  const [status, setStatus] = useState<RunStatus>('loading');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [results, setResults] = useState<Map<string, TurnResult>>(new Map());
  const [extra, setExtra] = useState<ReviewMarker[]>([]);
  const [practised, setPractised] = useState<Record<string, PracticedState>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<ReadonlySet<number>>(new Set());

  // Everything the callbacks read lives in refs, so one stable set of functions serves the screen.
  const r = useRef({
    results: new Map<string, TurnResult>(),
    extra: [] as ReviewMarker[],
    practised: {} as Record<string, PracticedState>,
    complete: false,
    run: null as StreamRun | null,
    targeted: false,
    pending: null as { ids: string[]; factor: number } | null,
    paused: false,
    saveTimer: null as ReturnType<typeof setTimeout> | null,
    plan: null as ReturnType<typeof planReview> | null,
    disposed: false,
  });
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  });

  const publish = useCallback(() => {
    setResults(new Map(r.current.results));
    setExtra(r.current.extra.slice());
    setPractised({ ...r.current.practised });
  }, []);

  const save = useCallback(
    (state: StoredReview['status']) => {
      const id = inputRef.current.gameId;
      if (!id) return;
      const markers = [
        ...[...r.current.results.values()].flatMap((x) => (x.marker ? [x.marker] : [])),
        ...r.current.extra,
      ];
      const review: StoredReview = {
        gameId: id,
        analysisVersion: ANALYSIS_VERSION,
        engineVersion: ENGINE_VERSION,
        status: state,
        results: Object.fromEntries(r.current.results),
        markers,
        practised: { ...r.current.practised },
      };
      // A failed save (storage full or off) is reported by the store's own notice and never blocks.
      void Promise.resolve()
        .then(() => storeOf().saveReview(review))
        .catch(() => undefined);
    },
    [storeOf],
  );

  const saveSoon = useCallback(() => {
    if (r.current.saveTimer) return;
    r.current.saveTimer = setTimeout(() => {
      r.current.saveTimer = null;
      if (!r.current.disposed) save(r.current.complete ? 'complete' : 'running');
    }, inputRef.current.saveDelayMs ?? 800);
  }, [save]);

  const handlers = useMemo<PoolHandlers>(
    () => ({
      onItems: (rs) => {
        for (const x of rs) r.current.results.set(x.itemId, x);
        publish();
        saveSoon();
      },
      onProgress: (p) => setProgress(p),
      onDone: (markers) => {
        // A targeted run starts with no time, so its first `done` is only "ready": the turn's items
        // are asked for now and the next `done` is the real one.
        const ask = r.current.pending;
        if (ask) {
          r.current.pending = null;
          r.current.run?.deeper(ask.ids, ask.factor);
          return;
        }
        // A targeted run does not own the whole plan: its `done` markers list everything it did not
        // run. Only a full run's end markers are the review's.
        if (!r.current.targeted) r.current.extra = markers.filter(isEndMarker);
        r.current.targeted = false;
        r.current.complete = true;
        setBusy(new Set());
        publish();
        setStatus('done');
        if (r.current.saveTimer) clearTimeout(r.current.saveTimer);
        r.current.saveTimer = null;
        save('complete');
      },
      onError: (m) => {
        setMessage(m);
        setStatus('failed');
        save('partial');
      },
    }),
    [publish, save, saveSoon],
  );

  const start = useCallback(
    (targeted: boolean) => {
      const i = inputRef.current;
      r.current.run?.cancel();
      r.current.targeted = targeted;
      r.current.complete = false;
      setStatus('running');
      setMessage(null);
      r.current.run = startReviewStream(
        {
          record: i.record,
          cards: [...i.cards.values()],
          seats: i.seats,
          ...(i.nodes !== undefined ? { nodes: i.nodes } : {}),
          // A targeted run starts with no time at all: every item is left for `deeper`.
          deadlineMs: targeted ? 0 : (i.deadlineMs ?? 55_000),
        },
        handlers,
        i.createWorker,
        i.size,
      );
    },
    [handlers],
  );

  // Open: the stored review first, then the run (or not).
  useEffect(() => {
    // The state object is never replaced, only changed, so the cleanup may hold it.
    const st = r.current;
    st.disposed = false;
    let alive = true;
    void (async () => {
      let stored: StoredReview | undefined;
      try {
        stored = gameId ? await storeOf().getReview(gameId) : undefined;
      } catch {
        stored = undefined;
      }
      if (!alive) return;
      const usable = stored && stored.analysisVersion === ANALYSIS_VERSION ? stored : undefined;
      if (stored) r.current.practised = { ...stored.practised };
      if (usable) {
        r.current.results = new Map(Object.entries(usable.results));
        r.current.extra = usable.markers.filter(isEndMarker);
      }
      publish();
      if (usable && usable.status === 'complete') {
        r.current.complete = true;
        setStatus('stored');
        return;
      }
      if (!live) {
        // A record from another version is never re-run: what was stored is what there is.
        r.current.complete = true;
        setStatus('stored');
        return;
      }
      start(false);
    })();
    return () => {
      alive = false;
      st.disposed = true;
      if (st.saveTimer) clearTimeout(st.saveTimer);
      st.saveTimer = null;
      const wasRunning = st.run !== null && !st.complete;
      st.run?.cancel();
      st.run = null;
      if (wasRunning) save('partial');
    };
    // One review per opened game: the record, the id and the store do not change under it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planItems = useCallback((turn: number, kind: FlagKind | null | undefined) => {
    const i = inputRef.current;
    const lookup = (id: string) => i.cards.get(id);
    r.current.plan ??= planReview(i.record, lookup, i.cards, { seats: i.seats });
    return r.current.plan.items
      .filter((x) => x.turn === turn && (!kind || x.kind === kind))
      .map((x) => x.id);
  }, []);

  const api: ReviewRun = {
    status,
    progress,
    results,
    extraMarkers: extra,
    practised,
    message,
    busyTurns: busy,
    prioritise: (turn) => r.current.run?.prioritise(turn),
    analyse: (turn, opts = {}) => {
      if (!inputRef.current.live) return;
      const factor = opts.factor ?? 1;
      if (!r.current.complete && r.current.run) {
        // Still running: this turn's items go first.
        r.current.run.prioritise(turn);
        return;
      }
      const ids = planItems(turn, opts.kind);
      if (ids.length === 0) return;
      // A targeted run: the turn's unrun markers are replaced by what the re-run finds.
      r.current.extra = r.current.extra.filter((m) => m.turn !== turn);
      setBusy(new Set([turn]));
      setStatus('running');
      r.current.complete = false;
      r.current.targeted = true;
      if (r.current.run) r.current.run.deeper(ids, factor);
      else {
        // No workers yet (a stored review, or paused): start them with no time at all, then ask.
        start(true);
        r.current.pending = { ids, factor };
      }
    },
    pause: () => {
      if (r.current.paused) return;
      r.current.paused = true;
      if (r.current.run && !r.current.complete) {
        r.current.run.cancel();
        r.current.run = null;
        setStatus('paused');
        save('partial');
      }
    },
    resume: () => {
      if (!r.current.paused) return;
      r.current.paused = false;
      if (!r.current.complete && inputRef.current.live && !r.current.run) start(false);
    },
    markPractised: (flagId, state) => {
      if (r.current.practised[flagId] === 'solved' && state === 'not-yet') return;
      r.current.practised = { ...r.current.practised, [flagId]: state };
      setPractised({ ...r.current.practised });
      const id = inputRef.current.gameId;
      if (!id) return;
      // Written on its own, so "Practised" survives a review that is still running.
      void (async () => {
        try {
          const s = storeOf();
          const cur = await s.getReview(id);
          const base: StoredReview = cur ?? {
            gameId: id,
            analysisVersion: ANALYSIS_VERSION,
            engineVersion: ENGINE_VERSION,
            status: r.current.complete ? 'complete' : 'partial',
            results: Object.fromEntries(r.current.results),
            markers: [],
            practised: {},
          };
          await s.saveReview({ ...base, practised: { ...base.practised, ...r.current.practised } });
        } catch {
          // Storage is full or off: the mark stays on this screen only.
        }
      })();
    },
  };
  return api;
}

/** A marker the scheduler's `done` made (not one a detector raised): the turn was not run. */
const isEndMarker = (m: ReviewMarker): boolean => m.reason === 'deadline' || m.reason === 'not-run';
