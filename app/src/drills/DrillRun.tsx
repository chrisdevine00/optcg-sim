/**
 * `/drills/:drill/run` (M9 WP4; flows F19): the item screens of one session. The route holds the
 * session in memory: the picked items, the answers so far, and which screen is up (item, answer,
 * summary). The banks and the ai judges load here, after the route mounts, so neither the start-up
 * chunk nor the Game chunk carries the bank JSON. Progress is written through the injected
 * `ProgressSink` when a session ends or is left.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '@optcg/cards';
import type { ListSet } from '@optcg/ai';
import { archetypeIdOf } from '../meta/model.ts';
import { loadCards } from '../play/setup/decks.ts';
import { navigate, useSearch } from '../router.tsx';
import { getStore } from '../store/index.ts';
import { cardIdsOf } from '../play/review/restore.ts';
import { answerFor, type AnswerView, type Detail } from './answers.ts';
import { BoardItemScreen, type BoardOutcome } from './items/BoardItem.tsx';
import { ChooseLineScreen } from './items/ChooseLine.tsx';
import { MulliganItemScreen } from './items/MulliganItem.tsx';
import { loadBank } from './banks.ts';
import { droppedNote, flagBank, markFlagPractised, workerRequester } from './intake.ts';
import { loadDrillAi } from './load.ts';
import { AnswerScreen, LeaveDialog, SummaryScreen } from './Screens.tsx';
import {
  filterEntries,
  pickItems,
  recordSafely,
  sourceNote,
  summarise,
  toDrillSession,
  type DrillEntry,
} from './session.ts';
import { factorOfPercent } from './timer.ts';
import { useItemTimer } from './Timer.tsx';
import type { AnswerResult, DonItem, DrillId, DrillQuery } from './types.ts';
import { DEFAULT_COUNT, DRILL_NAMES, isDrillId, SESSION_COUNTS } from './types.ts';
import './drills.css';

/** What `DrillRun` reads from the address: the drill, the filters, the count, the timer, the session id. */
export function queryOf(search: string): DrillQuery & { sid?: string } {
  const p = new URLSearchParams(search);
  const num = (k: string): number | undefined => {
    const v = Number(p.get(k));
    return p.get(k) !== null && Number.isFinite(v) ? v : undefined;
  };
  const count = num('count');
  const seat = p.get('seat');
  const source = p.get('source');
  // `?leader=OP18-021` (M11 Track C: "Practise with Franky") is the player's own Leader: every item of
  // every drill names it in `mine`, so it is the archetype of that Leader. An explicit `archetype` wins.
  const leader = p.get('leader');
  const archetype = p.get('archetype') ?? (leader ? archetypeIdOf(leader) : null);
  return {
    ...(archetype ? { archetype } : {}),
    ...(seat === 'first' || seat === 'second' ? { seat } : {}),
    ...(source === 'mine' || source === 'bank' ? { source } : {}),
    ...((SESSION_COUNTS as readonly number[]).includes(count ?? -1) ? { count: count! } : {}),
    ...(num('timer') !== undefined ? { timer: num('timer')! } : {}),
    ...(p.get('flag') ? { flag: p.get('flag')! } : {}),
    ...(p.get('sid') ? { sid: p.get('sid')! } : {}),
  };
}

/** Mulligan: the one archetype a session answered, so L12's "for each of 2 archetypes" can count it. */
function soleArchetype(
  entries: readonly DrillEntry[],
  rs: readonly AnswerResult[],
): string | undefined {
  const ids = new Set(
    rs
      .map((r) => entries.find((e) => e.item.id === r.itemId)?.item)
      .map((it) => (it && it.drill === 'mulligan' ? it.archetypeId : '')),
  );
  return ids.size === 1 && !ids.has('') ? [...ids][0] : undefined;
}

export const drillOfPath = (path: string): DrillId | null => {
  const seg = path.split('/').filter(Boolean);
  return seg[1] && isDrillId(seg[1]) ? seg[1] : null;
};

const newSid = (): string => {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return `${a[0]!.toString(36)}${a[1]!.toString(36)}`;
};

type Phase =
  | { k: 'loading' }
  | { k: 'error'; message: string }
  | { k: 'empty'; message: string }
  | { k: 'item'; i: number; mode: 'board' | 'lines' }
  | { k: 'answer'; i: number; view: AnswerView }
  | { k: 'summary' };

interface Loaded {
  ai: Awaited<ReturnType<typeof loadDrillAi>>;
  entries: DrillEntry[];
  lists: ListSet[];
  dropped: number;
}

export interface DrillRunProps {
  path: string;
  /** Tests: the clock for `DrillSession.at`. */
  clock?: () => Date;
}

export default function DrillRun({ path, clock = () => new Date() }: DrillRunProps) {
  const drill = drillOfPath(path);
  const search = useSearch();
  const q = useMemo(() => queryOf(search), [search]);
  const [sid] = useState(() => q.sid ?? newSid());
  const count = q.count ?? DEFAULT_COUNT;
  const [factor, setFactor] = useState<number | null>(() => factorOfPercent(q.timer));
  const [phase, setPhase] = useState<Phase>({ k: 'loading' });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [said, setSaid] = useState('');
  const [pool] = useState(() => new Map<string, Card>());
  const recorded = useRef(false);

  const say = useCallback((t: string) => setSaid((p) => (p === t ? `${t} ` : t)), []);

  const ensure = useCallback(
    async (ids: Iterable<string>): Promise<Map<string, Card>> => {
      const missing = [...new Set(ids)].filter((id) => !pool.has(id));
      if (missing.length > 0) for (const [id, c] of await loadCards(missing)) pool.set(id, c);
      return pool;
    },
    [pool],
  );

  // --- Load the bank, the player's own items, and pick the session --------------------------------
  useEffect(() => {
    if (!drill) return;
    let live = true;
    void (async () => {
      try {
        const ai = await loadDrillAi();
        const lists = ai.metaListSets();
        let bankItems: DrillEntry[];
        if (drill === 'mulligan') {
          // The mulligan bank is built from the lists, so it needs their cards first.
          await ensure(lists.flatMap((s) => [s.leaderId, ...s.lists.flat()]));
        }
        bankItems = (await loadBank(drill, ai, pool)).map((item) => ({ item }));
        let dropped = 0;
        if (q.source !== 'bank') {
          const store = getStore();
          const requester = workerRequester();
          const flags = await flagBank(store, {
            loadCards: (ids) => ensure(ids),
            cardIdsOf,
            request: requester,
            close: requester.close,
            mulliganItem: ai.mulliganItemFromFlag as never,
          });
          dropped = flags.dropped;
          bankItems = [...flags.items.filter((e) => e.item.drill === drill), ...bankItems];
        }
        if (q.flag) {
          const only = bankItems.filter((e) => e.item.id === `flag:${q.flag}`);
          bankItems = only;
        }
        const filtered = filterEntries(bankItems, q, archetypeIdOf);
        const picked = pickItems(filtered, { count, sid, source: q.source });
        if (!live) return;
        if (picked.length === 0) {
          const sourcedNone = drill === 'mulligan' && q.archetype && bankItems.length > 0;
          setPhase({
            k: 'empty',
            message: sourcedNone
              ? 'No sourced mulligan rule for this deck yet.'
              : 'No items match these choices. Try another archetype or seat.',
          });
          return;
        }
        // The cards of the hands in the picked mulligan items (a game's own hand may hold cards no list has).
        await ensure(picked.flatMap((e) => (e.item.drill === 'mulligan' ? e.item.hand : [])));
        if (!live) return;
        setLoaded({ ai, entries: picked, lists, dropped });
        setPhase({ k: 'item', i: 0, mode: 'board' });
      } catch (e) {
        if (live) setPhase({ k: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      live = false;
    };
    // The session is built once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = useMemo(() => loaded?.entries ?? [], [loaded]);
  const n = entries.length;
  const i = phase.k === 'item' || phase.k === 'answer' ? phase.i : 0;
  const entry = entries[i];
  const timer = useItemTimer(drill ?? 'mulligan', factor, `${sid}:${i}:${phase.k}`, say);

  useEffect(() => {
    document.title = `${drill ? DRILL_NAMES[drill] : 'Drill'} · OPTCG Sim`;
  }, [drill]);

  // --- Recording -------------------------------------------------------------------------------
  const record = useCallback(
    (rs: readonly AnswerResult[]) => {
      if (!drill || rs.length === 0) return;
      void recordSafely(
        toDrillSession({
          sid,
          drill,
          at: clock().toISOString(),
          results: rs,
          factor,
          archetype: q.archetype ?? soleArchetype(entries, rs),
        }),
      );
    },
    [clock, drill, entries, factor, q.archetype, sid],
  );

  const goNext = (from: number, rs: readonly AnswerResult[]) => {
    if (from + 1 < n) setPhase({ k: 'item', i: from + 1, mode: 'board' });
    else {
      if (!recorded.current) {
        recorded.current = true;
        record(rs);
      }
      setPhase({ k: 'summary' });
    }
  };

  const answer = (d: Detail) => {
    if (!loaded || !entry || phase.k !== 'item') return;
    const cards = pool;
    const view = answerFor(loaded.ai, entry, d, cards, loaded.lists);
    const r: AnswerResult = {
      itemId: entry.item.id,
      correct: view.correct,
      shownAnswer: d.kind === 'shown',
      ms: factor === null && d.kind === 'shown' ? null : Math.round(timer.elapsedMs()),
      // The limit that applies to THIS answer (M9-R4): the factor is locked from the first answer, and a
      // paused item has none.
      limit: timer.limitForRecord(),
    };
    setResults((rs) => [...rs, r]);
    if (entry.item.source.kind === 'flag' && d.kind !== 'shown')
      void markFlagPractised(
        getStore(),
        entry.item.source.gameId,
        entry.item.source.flagId,
        view.correct,
      );
    say(view.spoken);
    setPhase({ k: 'answer', i: phase.i, view });
  };

  const skip = () => {
    if (!entry || phase.k !== 'item') return;
    const rs = [
      ...results,
      { itemId: entry.item.id, correct: false, shownAnswer: false, ms: null, limit: null },
    ];
    setResults(rs);
    say('Skipped.');
    goNext(phase.i, rs);
  };

  const leave = () => {
    record(results);
    recorded.current = true;
    navigate(drill ? `/drills/${drill}` : '/drills');
  };

  // Esc opens "Leave drill?" on the screens that are not the board (the board's own Esc stays its own).
  useEffect(() => {
    const onboard =
      phase.k === 'item' && phase.mode === 'board' && entry?.item.drill !== 'mulligan';
    if (leaving || onboard || phase.k === 'loading') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) setLeaving(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, leaving, entry]);

  if (!drill)
    return (
      <main
        className="page page-full drill"
        id="main"
        data-path={path}
        aria-labelledby="page-title"
      >
        <h1 id="page-title" tabIndex={-1}>
          That drill does not exist
        </h1>
        <p>
          <a href="/drills">Back to the drills</a>
        </p>
      </main>
    );

  const region = (
    <div className="sr-only" role="status" aria-live="polite" data-testid="drill-live">
      {said}
    </div>
  );
  const shell = (body: React.ReactNode) => (
    <div data-path={path} className="drill-root">
      {region}
      {body}
      {leaving && <LeaveDialog onStay={() => setLeaving(false)} onLeave={leave} />}
    </div>
  );

  if (phase.k === 'loading' || phase.k === 'error' || phase.k === 'empty')
    return shell(
      <main
        className="page page-full drill"
        id="main"
        aria-busy={phase.k === 'loading'}
        aria-labelledby="page-title"
      >
        <h1 id="page-title" tabIndex={-1} ref={(el) => el?.focus()}>
          {phase.k === 'loading'
            ? `Getting ${DRILL_NAMES[drill]} ready`
            : phase.k === 'empty'
              ? 'Nothing to practise here'
              : 'The drill could not start'}
        </h1>
        {phase.k !== 'loading' && <p role="alert">{phase.message}</p>}
        {phase.k !== 'loading' && (
          <p>
            <button type="button" className="btn" onClick={() => navigate(`/drills/${drill}`)}>
              Back to the start screen
            </button>
          </p>
        )}
      </main>,
    );

  if (!loaded || phase.k === 'summary') {
    const s = summarise(drill, results, n, factor);
    const archetypeName = q.archetype ? q.archetype : null;
    return shell(
      <SummaryScreen
        drill={drill}
        summary={s}
        archetypeName={archetypeName}
        dropped={droppedNote(loaded?.dropped ?? 0)}
        again={() => navigate(`/drills/${drill}`)}
      />,
    );
  }

  if (phase.k === 'answer')
    return shell(
      <AnswerScreen
        view={phase.view}
        last={phase.i + 1 >= n}
        onNext={() => goNext(phase.i, results)}
      />,
    );

  // phase.k === 'item'
  const e = entry!;
  const note = sourceNote(e.item);
  const common = {
    index: phase.i,
    total: n,
    note,
    timer,
    factor,
    // The time allowed is fixed once the first answer counts (M9-R4): the summary scores against it.
    ...(results.length === 0 ? { onFactor: setFactor } : {}),
    onShow: () => answer({ kind: 'shown' }),
    onSkip: skip,
    onLeave: () => setLeaving(true),
  };
  if (e.item.drill === 'mulligan')
    return shell(
      <MulliganItemScreen
        ai={loaded.ai}
        item={e.item}
        cards={pool}
        {...common}
        onAnswer={(redraw) => answer({ kind: 'mulligan', redraw })}
      />,
    );
  if (e.item.drill === 'don' && phase.mode === 'lines' && 'lines' in e.item)
    return shell(
      <ChooseLineScreen
        item={e.item as DonItem}
        {...common}
        onSubmit={(lineId) => answer({ kind: 'line', lineId })}
        onBoard={() => setPhase({ k: 'item', i: phase.i, mode: 'board' })}
      />,
    );
  return shell(
    <BoardItemScreen
      ai={loaded.ai}
      entry={e}
      load={ensure}
      {...common}
      onOutcome={(outcome: BoardOutcome) => answer({ kind: 'board', outcome })}
      onNoLethal={() => answer({ kind: 'no-lethal' })}
      {...(e.item.drill === 'don' && 'lines' in e.item
        ? { onChooseLine: () => setPhase({ k: 'item', i: phase.i, mode: 'lines' }) }
        : {})}
    />,
  );
}
