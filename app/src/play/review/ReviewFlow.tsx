/**
 * Game review (M8 WP6; learning-ui §4, flows F16). `ReviewScreen` takes a finished game's record, its
 * card data and its saved id, runs (or reads) the analysis (`useReview`), and shows the Overview:
 * a two-row timeline with a Life line, a flag list, and the selected flag with "What you did", its
 * `Explanation`, the turn's notes and the pinned footer (Study this moment, Play from here, Practice
 * this). Study restores the board at the flag's decision, read-only, with the explanation in the
 * rail; Play from here and Practice this start from that exact position against the same AI tier.
 *
 * The screen reads the record, never the live game that made it, so it opens the same way from the
 * post-game button and from History (`/reviews/:id`). A record from another build (`liveness`) is
 * read-only: the stored review is shown, and Play and Practice say why they are off.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { guideName, playbookFor, type FlagKind, type ReviewFlag } from '@optcg/ai';
import type { Card } from '@optcg/cards';
import type { PlayerId } from '@optcg/engine';
import { Footer } from '../../Footer.tsx';
import { Header } from '../../Header.tsx';
import { getStore } from '../../store/index.ts';
import { liveness, readOnlyWord, staleCopyOf, type Liveness } from '../../store/staleness.ts';
import type { GameMeta } from '../../store/types.ts';
import type { SessionRecord } from '../../session/index.ts';
import { ExplanationView } from '../coach/ExplanationView.tsx';
import { lineRefs } from '../coach/coach.ts';
import { GameController } from '../game/controller.ts';
import { Game } from '../game/Game.tsx';
import { PoliteQueue } from '../game/politeQueue.ts';
import { prefixOf } from './analyse.ts';
import { FlagList, type SortBy } from './FlagList.tsx';
import {
  KIND_SHAPE,
  KIND_WORD,
  PRACTICE_INTRO,
  PRACTICE_LABEL,
  SEVERITY,
  actorsOf,
  collect,
  certaintyOf,
  contextOf,
  DEEPER_LABEL,
  markerCopy,
  finalLife,
  flagName,
  notableMoves,
  practiceOf,
  practisedWord,
  sortFlags,
  summaryText,
  tierWord,
  turnStartIndex,
  turnsOf,
} from './model.ts';
import { INERT_AI, leadersOf, restoreConfig } from './restore.ts';
import { Sparkline } from './Sparkline.tsx';
import { FlagShape, LEGEND, Timeline } from './Timeline.tsx';
import { useReview, type UseReviewInput } from './useReview.ts';
import '../play.css';
import './review.css';

export interface ReviewScreenProps {
  /** The saved game's id; null when it could not be saved (Practised is then kept on screen only). */
  gameId: string | null;
  record: SessionRecord;
  meta: GameMeta;
  cards: Map<string, Card>;
  /** Leave the review (to the finished board, or to History). */
  onBack(): void;
  backLabel: string;
  onHome(): void;
  /** Tests: in-process workers, a node cap, a store. */
  review?: Partial<UseReviewInput>;
}

type Screen =
  | { kind: 'overview' }
  | { kind: 'study'; ctl: GameController; flagId: string | null; turn: number }
  | { kind: 'play'; ctl: GameController; flag: ReviewFlag | null; turn: number; puzzle: boolean };

const RESULT = { won: 'You won', lost: 'You lost', draw: 'Draw' } as const;

/** One line of what the player did, from the flag's own record (built in ai/). */
export const whatYouDid = (f: ReviewFlag): string =>
  f.did.length === 0
    ? 'Nothing: the game ended before you played.'
    : f.did
        .slice(0, 6)
        .map((m) => m.text)
        .join(' · ') + (f.did.length > 6 ? ' · …' : '');

export function ReviewScreen(props: ReviewScreenProps) {
  const { gameId, record, meta, cards, onBack, backLabel, onHome } = props;
  const me = meta.me;
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';

  // Is the record still live on this build? Asked once, with its cards loaded (M8 WP5).
  const live = useMemo<Liveness>(() => {
    try {
      return liveness(record, (id) => cards.get(id));
    } catch {
      return { live: false, reason: 'broken', detail: 'its record cannot be replayed' };
    }
  }, [record, cards]);
  useEffect(() => {
    if (!gameId) return;
    const kv = getStore().meta;
    void (live.live ? kv.delete(`stale.${gameId}`) : kv.set(`stale.${gameId}`, live.reason)).catch(
      () => undefined,
    );
  }, [gameId, live]);

  const turns = useMemo(() => turnsOf(record), [record]);
  const oppName = cards.get(leadersOf(record)[opp])?.name || 'the AI';
  const guide = useMemo(() => guideOf(record, me), [record, me]);
  const actors = useMemo(() => actorsOf(turns, me, oppName, guide), [turns, me, oppName, guide]);

  const run = useReview({
    gameId,
    record,
    cards,
    seats: [me],
    live: live.live,
    ...props.review,
  });
  const data = useMemo(
    () => collect(run.results.values(), run.extraMarkers, me),
    [run.results, run.extraMarkers, me],
  );

  // The opponent's notable moves come from the game's own log: a read-only board over the record.
  const { notable, noOpponentRow } = useMemo(() => {
    if (!live.live) return { notable: new Map<number, string[]>(), noOpponentRow: true };
    let ctl: GameController | null = null;
    try {
      ctl = new GameController(cards, record.start, {
        ...restoreConfig(record, meta, cards),
        aiPort: INERT_AI,
        restore: { record, readOnly: true },
      });
      return {
        notable: notableMoves(ctl.logLines(), cards, me, oppName),
        noOpponentRow: false,
      };
    } catch {
      return { notable: new Map<number, string[]>(), noOpponentRow: true };
    } finally {
      ctl?.dispose();
    }
  }, [live, cards, record, meta, me, oppName]);

  const [screen, setScreen] = useState<Screen>({ kind: 'overview' });
  const [sel, setSel] = useState<{ turn: number | null; flag: string | null }>({
    turn: null,
    flag: null,
  });
  const [sort, setSort] = useState<SortBy>('severity');
  const [kind, setKind] = useState<FlagKind | 'all'>('all');
  const [focusBack, setFocusBack] = useState<'heading' | 'flag'>('heading');

  const visible = useMemo(() => {
    const list = data.flags.filter((f) => kind === 'all' || f.kind === kind);
    return sort === 'severity'
      ? sortFlags(list)
      : [...list].sort((a, b) => a.turn - b.turn || a.decisionIndex - b.decisionIndex);
  }, [data.flags, sort, kind]);

  // Nothing chosen yet: the most severe flag is the one shown.
  const flag =
    data.flags.find((f) => f.id === sel.flag) ??
    (sel.turn === null && sel.flag === null ? (visible[0] ?? null) : null);
  const turn = sel.turn ?? flag?.turn ?? null;

  // ------------------------------------------------------------------------------------------
  // What is said (once per turn, muted while a game is on screen) and what is paused
  // ------------------------------------------------------------------------------------------
  const playing = screen.kind === 'play';
  const [said, setSaid] = useState({ n: 0, text: '' });
  const queue = useMemo(
    () => new PoliteQueue((text) => setSaid((x) => ({ n: x.n + 1, text }))),
    [],
  );
  useEffect(() => () => queue.clear(), [queue]);
  const say = useCallback(
    (t: string) => {
      if (!playing) queue.push(t);
    },
    [playing, queue],
  );
  const heard = useRef({ turn: 0, status: '', first: true });
  const total = run.progress?.turns ?? turns.length;
  useEffect(() => {
    const p = run.progress;
    if (run.status !== 'running' || !p || p.turn <= heard.current.turn) return;
    heard.current.turn = p.turn;
    const prefix = heard.current.first ? 'Review. ' : '';
    heard.current.first = false;
    say(`${prefix}Analysing turn ${p.turn} of ${p.turns || total}.`);
  }, [run.progress, run.status, total, say]);
  useEffect(() => {
    const was = heard.current.status;
    heard.current.status = run.status;
    if (run.status === 'done' && was === 'running')
      say(`Review ready: ${data.flags.length} ${data.flags.length === 1 ? 'flag' : 'flags'}.`);
    else if (run.status === 'stored' && was !== 'stored')
      say(`Review. ${data.flags.length} ${data.flags.length === 1 ? 'flag' : 'flags'}.`);
  }, [run.status, data.flags.length, say]);
  // Play from here and Practice pause the analysis (the AI's own search gets the cores).
  useEffect(() => {
    if (playing) run.pause();
    else run.resume();
    // pause and resume are stable and only the screen drives them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    document.title = 'Game review · OPTCG Sim';
  }, []);

  // ------------------------------------------------------------------------------------------
  // Opening a restored board
  // ------------------------------------------------------------------------------------------
  const board = (
    index: number,
    o: {
      readOnly?: boolean;
      puzzle?: { turn: number; judge: NonNullable<ReviewFlag['practice']>['judge'] };
    },
  ): GameController => {
    const prefix = prefixOf(record, index);
    return new GameController(cards, prefix.start, {
      ...restoreConfig(record, meta, cards),
      // A board that is only looked at starts no AI worker.
      ...(o.readOnly ? { aiPort: INERT_AI } : {}),
      restore: {
        record: prefix,
        ...(o.readOnly ? { readOnly: true } : {}),
        ...(o.puzzle ? { puzzle: o.puzzle } : {}),
      },
    });
  };
  const studyAt = (f: ReviewFlag | null, t: number) => {
    const c = board(f ? f.restoreIndex : turnStartIndex(turns, t), { readOnly: true });
    setScreen({ kind: 'study', ctl: c, flagId: f?.id ?? null, turn: t });
  };
  const playAt = (f: ReviewFlag | null, t: number, practice: boolean) => {
    const pr = practice ? practiceOf(f, live.live, staleCopyOf(live)) : null;
    const index = f ? f.restoreIndex : turnStartIndex(turns, t);
    const c = board(index, pr?.ok ? { puzzle: { turn: pr.turn, judge: pr.judge } } : {});
    c.start();
    setScreen({ kind: 'play', ctl: c, flag: f, turn: t, puzzle: !!pr?.ok });
  };
  const closeScreen = () => {
    if (screen.kind !== 'overview') screen.ctl.dispose();
    setFocusBack('flag');
    setScreen({ kind: 'overview' });
  };

  const choose = (turnNo: number, id: string | null) => {
    setSel({ turn: turnNo, flag: id });
    const f = id ? data.flags.find((x) => x.id === id) : null;
    if (f) {
      const i = visible.findIndex((x) => x.id === f.id);
      say(`Flag ${i + 1} of ${visible.length} selected. ${flagName(f, actors)}`);
    }
  };

  // L-SR4: Play from here and Practice swap the whole screen: focus lands on the new decision's
  // heading, and the player is told where they are, once the board has mounted.
  const play = screen.kind === 'play' ? screen : null;
  useEffect(() => {
    if (!play) return;
    const judge = play.flag?.practice?.judge;
    const t = setTimeout(() => {
      document.getElementById('decision-title')?.focus();
      play.ctl.announce(
        play.puzzle && judge
          ? PRACTICE_INTRO[judge](play.flag?.practice?.turn ?? play.turn)
          : `Playing from turn ${play.turn}, as it stood.`,
      );
    }, 150);
    return () => clearTimeout(t);
  }, [play]);
  // "Practised": the puzzle's result is written to the review as it happens.
  useEffect(() => {
    if (!play?.puzzle || !play.flag) return;
    const f = play.flag;
    const note = () => {
      const s = play.ctl.puzzleState();
      if (s === 'solved') run.markPractised(f.id, 'solved');
      else if (s === 'failed') run.markPractised(f.id, 'not-yet');
    };
    note();
    return play.ctl.subscribe(note);
    // markPractised is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);
  // Leaving the review ends any restored board it still holds.
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  });
  useEffect(
    () => () => {
      const s = screenRef.current;
      if (s.kind !== 'overview') s.ctl.dispose();
    },
    [],
  );

  if (screen.kind === 'study') {
    const f = screen.flagId ? (data.flags.find((x) => x.id === screen.flagId) ?? null) : null;
    const at = f ? visible.findIndex((x) => x.id === f.id) : -1;
    return (
      <Study
        ctl={screen.ctl}
        flag={f}
        turn={screen.turn}
        at={at}
        count={visible.length}
        marker={data.markers.find((m) => m.turn === screen.turn)}
        archetype={archetypeOf(f, record, me)}
        live={live.live}
        staleCopy={staleCopyOf(live)}
        practised={run.practised}
        step={(d) => {
          const next = visible[at + d];
          if (!next) return;
          screen.ctl.dispose();
          setSel({ turn: next.turn, flag: next.id });
          studyAt(next, next.turn);
        }}
        onBack={closeScreen}
        onPlay={() => {
          screen.ctl.dispose();
          playAt(f, screen.turn, false);
        }}
        onPractice={() => {
          screen.ctl.dispose();
          playAt(f, screen.turn, true);
        }}
        onHome={onHome}
      />
    );
  }
  if (screen.kind === 'play') {
    return (
      <Game
        key={`${screen.puzzle ? 'practice' : 'play'}-${screen.turn}-${screen.ctl.session.seed}`}
        ctl={screen.ctl}
        onHome={closeScreen}
        onNewGame={closeScreen}
        onRematch={closeScreen}
        onReview={closeScreen}
        reviewLabel="Back to the review"
      />
    );
  }

  const status = statusLine(run.status, run.progress, turns.length, data, live, run.message);
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <Overview
        focusMode={focusBack}
        meta={meta}
        record={record}
        oppName={oppName}
        actors={actors}
        turns={turns}
        data={data}
        flag={flag}
        turn={turn}
        selectedFlag={flag?.id ?? null}
        visible={visible}
        sort={sort}
        kind={kind}
        setSort={setSort}
        setKind={setKind}
        notable={notable}
        noOpponentRow={noOpponentRow}
        run={run}
        live={live}
        status={status}
        said={said}
        archetype={archetypeOf(flag, record, me)}
        onChoose={choose}
        onStudy={() => studyAt(flag, turn ?? 1)}
        onPlay={() => playAt(flag, turn ?? 1, false)}
        onPractice={() => playAt(flag, turn ?? 1, true)}
        onBack={onBack}
        backLabel={backLabel}
      />
      <Footer />
    </div>
  );
}

/** The guide's name for a mulligan flag's sourced label ("From the Rocks guide (sourced)"). */
function archetypeOf(
  f: ReviewFlag | null,
  record: SessionRecord,
  me: PlayerId,
): string | undefined {
  return f?.kind === 'mulligan' ? guideOf(record, me) : undefined;
}

const guideOf = (record: SessionRecord, me: PlayerId): string =>
  guideName(playbookFor(leadersOf(record)[me]));

function statusLine(
  status: ReturnType<typeof useReview>['status'],
  p: ReturnType<typeof useReview>['progress'],
  turnCount: number,
  data: ReturnType<typeof collect>,
  live: Liveness,
  message: string | null,
): string {
  if (status === 'failed') return `The analysis stopped: ${message ?? 'something went wrong'}.`;
  if (status === 'loading') return 'Opening the review…';
  if (status === 'running' || status === 'paused')
    return `Analysing turn ${Math.max(1, p?.turn ?? 1)} of ${p?.turns || turnCount}…${data.flags.length ? ` ${summaryText(data.flags, data.markers)} so far.` : ''}`;
  const base =
    data.flags.length === 0 && data.markers.length === 0
      ? 'Analysed: no flags found.'
      : summaryText(data.flags, data.markers);
  return live.live ? base : `${base} · ${readOnlyWord(live)}`;
}

// ---------------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------------

function Overview(p: {
  focusMode: 'heading' | 'flag';
  meta: GameMeta;
  record: SessionRecord;
  oppName: string;
  actors: ReturnType<typeof actorsOf>;
  turns: ReturnType<typeof turnsOf>;
  data: ReturnType<typeof collect>;
  flag: ReviewFlag | null;
  turn: number | null;
  selectedFlag: string | null;
  visible: ReviewFlag[];
  sort: SortBy;
  kind: FlagKind | 'all';
  setSort(s: SortBy): void;
  setKind(k: FlagKind | 'all'): void;
  notable: ReadonlyMap<number, string[]>;
  noOpponentRow: boolean;
  run: ReturnType<typeof useReview>;
  live: Liveness;
  status: string;
  said: { n: number; text: string };
  archetype: string | undefined;
  onChoose(turn: number, flag: string | null): void;
  onStudy(): void;
  onPlay(): void;
  onPractice(): void;
  onBack(): void;
  backLabel: string;
}) {
  const { meta, data, flag, run, actors } = p;
  const root = useRef<HTMLElement>(null);
  // "Analyse deeper" is offered once per turn: M8-2 showed a second, bigger run does not settle a
  // turn the first could not, so a turn already tried says so instead of offering it again.
  const [tried, setTried] = useState<ReadonlySet<number>>(new Set());
  const deeper = (m: { turn: number; kind?: FlagKind | null | undefined }) => {
    setTried((t) => new Set(t).add(m.turn));
    run.analyse(m.turn, { kind: m.kind, factor: 10 });
  };
  // A new page (L-SR4): focus its heading, or, coming back from Study or a game, the flag list.
  useEffect(() => {
    const box = root.current?.querySelector<HTMLElement>('[role="listbox"]');
    if (p.focusMode === 'flag' && box) box.focus();
    else document.getElementById('rv-title')?.focus();
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = run.status === 'running' || run.status === 'paused' || run.status === 'loading';
  const pending = useMemo(() => {
    const s = new Set<number>();
    if (running) for (const t of p.turns) if (t.player === meta.me) s.add(t.turn);
    return s;
  }, [running, p.turns, meta.me]);
  const hatched = useMemo(() => {
    const s = new Set(pending);
    for (const t of run.busyTurns) s.add(t);
    return s;
  }, [pending, run.busyTurns]);

  const idx = flag ? p.visible.findIndex((f) => f.id === flag.id) : -1;
  const step = (d: 1 | -1) => {
    if (p.visible.length === 0) return;
    const to = p.visible[(Math.max(0, idx) + d + p.visible.length) % p.visible.length]!;
    p.onChoose(to.turn, to.id);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
    }
  };

  const result = RESULT[meta.result];
  const turnInfo = p.turns.find((t) => t.turn === p.turn);
  const detailTurn = p.turn;
  const marker = detailTurn === null ? undefined : data.markers.find((m) => m.turn === detailTurn);
  const turnNotes = detailTurn === null ? [] : (data.notes.get(detailTurn) ?? []);
  const myTurn = detailTurn !== null && turnInfo?.player === meta.me;
  const analysing = detailTurn !== null && hatched.has(detailTurn);
  const moves = detailTurn === null ? [] : (p.notable.get(detailTurn) ?? []);

  return (
    <main id="main" ref={root} className="review" aria-labelledby="rv-title" onKeyDown={onKey}>
      <div className="rv-head">
        <h1 id="rv-title" tabIndex={-1}>
          Game review
        </h1>
        <p className="rv-sub">
          {result}
          {` · turn ${meta.turns} · against ${p.oppName}, ${tierWord(meta.tier)}`}
          {meta.deckName && ` · ${meta.deckName}`}
          {meta.tags.map((t) => (
            <span key={t} className="chip outline">
              {' '}
              {t}
            </span>
          ))}
          {!p.live.live && <span className="chip outline"> {readOnlyWord(p.live)}</span>}
        </p>
        <button type="button" className="btn small" onClick={p.onBack}>
          <span aria-hidden="true">← </span>
          {p.backLabel}
        </button>
      </div>
      <p className="rv-status" data-testid="review-status">
        {p.status}
        {run.status === 'done' &&
          data.markers.some((m) => m.reason === 'search-incomplete' && !tried.has(m.turn)) && (
            <>
              {' '}
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  const m = data.markers.find(
                    (x) => x.reason === 'search-incomplete' && !tried.has(x.turn),
                  );
                  if (m) deeper(m);
                }}
              >
                {DEEPER_LABEL}
              </button>
            </>
          )}
      </p>
      {!p.live.live && (
        <p className="notice" role="note">
          {staleCopyOf(p.live)}
        </p>
      )}
      <div className="sr-only" role="status" aria-live="polite" data-testid="review-announce">
        {p.said.text && <p key={p.said.n}>{p.said.text}</p>}
      </div>

      <section aria-labelledby="rv-tl-h" className="rv-card">
        <h2 id="rv-tl-h">Turn timeline</h2>
        <Timeline
          turns={p.turns}
          actors={actors}
          flags={data.flags}
          markers={data.markers}
          notes={data.notes}
          notable={p.notable}
          pending={hatched}
          noOpponentRow={p.noOpponentRow}
          selectedFlag={p.selectedFlag}
          selectedTurn={p.turn}
          onChoose={p.onChoose}
          me={meta.me}
        />
        <Sparkline turns={p.turns} final={finalLife(p.record)} me={meta.me} oppName={p.oppName} />
        <ul className="rv-legend subtle" aria-label="Key to the shapes">
          {LEGEND.map((l) => (
            <li key={l.text}>
              <FlagShape shape={l.shape} size={12} /> {l.text}
            </li>
          ))}
          <li>
            <FlagShape shape="diamond" size={12} hindsight /> Hindsight (dashed)
          </li>
          <li>
            <span className="hatch-swatch" aria-hidden="true" /> Not analysed yet
          </li>
        </ul>
      </section>

      <section aria-labelledby="rv-fl-h" className="rv-card">
        <h2 id="rv-fl-h">Flags</h2>
        <FlagList
          flags={p.visible}
          selected={p.selectedFlag}
          sort={p.sort}
          kind={p.kind}
          actors={actors}
          practised={run.practised}
          onSort={p.setSort}
          onKind={p.setKind}
          onChoose={(id) => {
            const f = data.flags.find((x) => x.id === id);
            if (f) p.onChoose(f.turn, id);
          }}
          onOpen={(id) => {
            const f = data.flags.find((x) => x.id === id);
            if (f) {
              p.onChoose(f.turn, id);
              p.onStudy();
            }
          }}
          empty={
            running
              ? 'Looking at your turns…'
              : data.flags.length > 0
                ? 'No flags of this kind.'
                : 'No flags. A turn where something could have gone better would be listed here.'
          }
        />
      </section>

      {flag ? (
        <FlagDetail
          flag={flag}
          actors={actors}
          notes={turnNotes}
          practisedState={run.practised[flag.id]}
          live={p.live.live}
          staleCopy={staleCopyOf(p.live)}
          archetype={p.archetype}
          onStudy={p.onStudy}
          onPlay={p.onPlay}
          onPractice={p.onPractice}
        />
      ) : (
        detailTurn !== null && (
          <section
            aria-labelledby="rv-sel-h"
            className="rv-card rv-detail"
            data-testid="selected-turn"
          >
            <h2 id="rv-sel-h">
              {detailTurn === 0
                ? 'Mulligan'
                : `Turn ${detailTurn}, ${myTurn ? 'your turn' : `${p.oppName}’s turn`}`}
            </h2>
            {myTurn && !marker && !analysing && data.flags.every((f) => f.turn !== detailTurn) && (
              <p>No flag on this turn.</p>
            )}
            {moves.length > 0 && (
              <p>
                <b>{p.oppName}’s notable moves:</b> {moves.join(' · ')}.
              </p>
            )}
            {analysing && (
              <p>
                {run.busyTurns.has(detailTurn) ? 'Analysing this turn…' : 'Not analysed yet.'}{' '}
                <button type="button" className="btn small" onClick={() => run.analyse(detailTurn)}>
                  Analyse now
                </button>
              </p>
            )}
            {marker && !analysing && (
              <MarkerNote
                marker={marker}
                live={p.live.live}
                tried={tried.has(marker.turn)}
                onDeeper={() => deeper(marker)}
                onNow={() => run.analyse(marker.turn)}
              />
            )}
            <Notes notes={turnNotes} />
            <div className="rv-foot">
              <button type="button" className="btn primary" id="study-btn" onClick={p.onStudy}>
                Study this turn
              </button>
              <button
                type="button"
                className="btn"
                id="play-from-btn"
                disabled={!p.live.live}
                aria-describedby={p.live.live ? undefined : 'rv-why-off'}
                onClick={p.onPlay}
              >
                Play from here
              </button>
              {!p.live.live && (
                <span id="rv-why-off" className="subtle">
                  {staleCopyOf(p.live)}
                </span>
              )}
            </div>
          </section>
        )
      )}
    </main>
  );
}

function MarkerNote({
  marker,
  live,
  tried,
  onDeeper,
  onNow,
}: {
  marker: {
    reason: 'search-incomplete' | 'deadline' | 'not-run';
    explanation?: import('@optcg/ai').Explanation;
  };
  live: boolean;
  /** "Analyse deeper" has been run on this turn already. */
  tried: boolean;
  onDeeper(): void;
  onNow(): void;
}) {
  const copy = markerCopy(marker.reason, tried);
  return (
    <div className="rv-marker" data-testid="marker-note">
      <p>
        <b>{copy.lead}</b> {copy.body}
      </p>
      {live && copy.button && (
        <button
          type="button"
          className="btn small"
          onClick={copy.button === 'deeper' ? onDeeper : onNow}
        >
          {copy.button === 'deeper' ? DEEPER_LABEL : 'Analyse now'}
        </button>
      )}
    </div>
  );
}

/** Things worth saying that are not flags: "5 active DON!! held for your Leader: not counted". */
function Notes({ notes }: { notes: readonly import('@optcg/ai').Explanation[] }) {
  if (notes.length === 0) return null;
  return (
    <section aria-labelledby="rv-notes-h" className="rv-notes" data-testid="turn-notes">
      <h3 id="rv-notes-h">Not flagged</h3>
      {notes.map((n, i) => (
        <ExplanationView
          key={i}
          ex={n}
          context="review"
          verbosity="learner"
          idPrefix={`rv-note-${i}`}
          headingLevel={4}
          lessonLinks
        />
      ))}
    </section>
  );
}

function FlagDetail({
  flag,
  actors,
  notes,
  practisedState,
  live,
  staleCopy,
  archetype,
  onStudy,
  onPlay,
  onPractice,
}: {
  flag: ReviewFlag;
  actors: ReturnType<typeof actorsOf>;
  notes: readonly import('@optcg/ai').Explanation[];
  practisedState: 'solved' | 'not-yet' | undefined;
  live: boolean;
  staleCopy: string;
  archetype: string | undefined;
  onStudy(): void;
  onPlay(): void;
  onPractice(): void;
}) {
  const practice = practiceOf(flag, live, staleCopy);
  const mark = practisedWord(practisedState);
  return (
    <section aria-labelledby="rv-sel-h" className="rv-card rv-detail" data-testid="selected-flag">
      <h2 id="rv-sel-h">
        {flag.kind === 'mulligan'
          ? 'Selected flag · mulligan'
          : `Selected flag · turn ${flag.turn}`}
      </h2>
      <p className="rv-meta">
        <FlagShape
          shape={KIND_SHAPE[flag.kind]}
          size={SEVERITY[flag.severity].size}
          hindsight={flag.severity === 'hindsight'}
        />{' '}
        {KIND_WORD[flag.kind]} · {SEVERITY[flag.severity].word} · {certaintyOf(flag, archetype)}
        {mark && (
          <>
            {' · '}
            <span data-testid="practised">{mark}</span>
          </>
        )}
      </p>
      <p className="rv-did">
        <b>What you did:</b> {whatYouDid(flag)}
      </p>
      <ExplanationView
        ex={flag.explanation}
        context={contextOf(flag)}
        verbosity="learner"
        idPrefix="rv-ex"
        headingLevel={3}
        lessonLinks
        archetype={archetype}
      />
      <Notes notes={notes} />
      <div className="rv-foot">
        <button type="button" className="btn primary" id="study-btn" onClick={onStudy}>
          Study this moment
        </button>
        <button
          type="button"
          className="btn"
          id="play-from-btn"
          disabled={!live}
          aria-describedby={live ? undefined : 'rv-why-off'}
          onClick={onPlay}
        >
          Play from here
        </button>
        <button
          type="button"
          className="btn"
          id="practice-btn"
          disabled={!practice.ok}
          aria-describedby={practice.ok ? undefined : 'rv-why-off'}
          onClick={onPractice}
        >
          {mark ? 'Practice again' : 'Practice this'}
        </button>
        {(!live || !practice.ok) && (
          <span id="rv-why-off" className="subtle" data-testid="practice-off">
            {!live ? staleCopy : !practice.ok ? practice.reason : ''}
          </span>
        )}
        {practice.ok && <span className="sr-only">{PRACTICE_LABEL[practice.judge]}</span>}
      </div>
      <span className="sr-only">{actors.oppName}</span>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Study: the restored board, read-only, with the explanation in the rail (learning-ui §4.1)
// ---------------------------------------------------------------------------------------------

function Study({
  ctl,
  flag,
  turn,
  at,
  count,
  marker,
  archetype,
  live,
  staleCopy,
  practised,
  step,
  onBack,
  onPlay,
  onPractice,
  onHome,
}: {
  ctl: GameController;
  flag: ReviewFlag | null;
  turn: number;
  at: number;
  count: number;
  marker: { reason: string } | undefined;
  archetype: string | undefined;
  live: boolean;
  staleCopy: string;
  practised: Readonly<Record<string, 'solved' | 'not-yet'>>;
  step: (delta: -1 | 1) => void;
  onBack: () => void;
  onPlay: () => void;
  onPractice: () => void;
  onHome: () => void;
}) {
  // Show lights cards by their handles in the player's view: only the `public` proof names them
  // that way (a Hindsight line is searched on the full state, with engine ids).
  const refs = useMemo(
    () =>
      flag?.kind === 'missed-lethal' && flag.severity === 'severe' && flag.lethal
        ? lineRefs(flag.lethal.public, ctl.view())
        : [],
    [flag, ctl],
  );
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    back.current?.focus();
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT')) return;
      if (e.key === 'Escape' && !document.querySelector('dialog[open], [role="dialog"]')) {
        e.preventDefault();
        onBack();
      } else if (at >= 0 && (e.key === 'n' || e.key === 'N')) step(e.shiftKey ? -1 : 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const practice = practiceOf(flag, live, staleCopy);
  const mark = flag ? practisedWord(practised[flag.id]) : null;
  const where = flag
    ? flag.kind === 'mulligan'
      ? 'at your opening hand, before the mulligan'
      : flag.kind === 'should-counter' || flag.kind === 'counter-wasted'
        ? 'at your counter decision'
        : flag.kind === 'target'
          ? 'at the moment before the attack'
          : flag.kind === 'given-away'
            ? 'at the moment before your Blocker attacked'
            : 'when your Main Phase began'
    : 'at the start of the turn';
  const rail = (
    <div
      className="study"
      id="decision"
      tabIndex={-1}
      role="region"
      aria-label="Study this moment"
      data-testid="study-rail"
    >
      <div className="study-head">
        <button type="button" className="btn small" ref={back} onClick={onBack}>
          <span aria-hidden="true">←</span> Overview <kbd>Esc</kbd>
        </button>
        <span className="study-step">
          {at >= 0 ? `Flag ${at + 1} of ${count}` : `Turn ${turn}`}
        </span>
        <button
          type="button"
          className="iconbtn"
          aria-label="Previous flag (Shift+N)"
          disabled={at <= 0}
          onClick={() => step(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="iconbtn"
          aria-label="Next flag (N)"
          disabled={at < 0 || at >= count - 1}
          onClick={() => step(1)}
        >
          ›
        </button>
      </div>
      <p className="study-note">
        Turn {turn}, as it stood {where}. Read-only: nothing here is played.
      </p>
      <div className="study-body">
        {flag ? (
          <ExplanationView
            ex={flag.explanation}
            context={contextOf(flag)}
            verbosity="learner"
            idPrefix="study-ex"
            headingLevel={2}
            lessonLinks
            archetype={archetype}
            {...(refs.length > 0
              ? { onShow: (i: number) => ctl.coach.lightRefs(refs[i] ?? [], i) }
              : {})}
          />
        ) : (
          <p>{marker ? 'Not fully checked.' : 'No flag on this turn.'} No better line computed.</p>
        )}
      </div>
      <div className="study-foot">
        <button type="button" className="btn" id="play-from-btn" disabled={!live} onClick={onPlay}>
          Play from here
        </button>
        <button
          type="button"
          className="btn primary"
          id="practice-btn"
          disabled={!practice.ok}
          aria-describedby={practice.ok ? undefined : 'study-why-off'}
          onClick={onPractice}
        >
          {mark ? 'Practice again' : 'Practice this'}
        </button>
      </div>
      {(!live || !practice.ok) && (
        <p id="study-why-off" className="study-note">
          {!live ? staleCopy : !practice.ok ? practice.reason : ''}
        </p>
      )}
    </div>
  );
  return <Game ctl={ctl} onHome={onHome} onNewGame={onBack} onRematch={onBack} studyRail={rail} />;
}
