/**
 * Game review, minimal (learning-ui §4): the missed-lethal flag end to end. After a game, the
 * review runs in a worker, then shows the Overview (a turn timeline, the flag list and the selected
 * flag's explanation). **Study this moment** restores the board at that decision, read-only;
 * **Play from here** and **Practice this** start from that exact position against the same AI.
 * Full Game Review (every flag kind, Hindsight filters, History, drills) is M8; the shapes here
 * (`ReviewFlag`, the timeline, the flag list, the rail) are the ones it extends.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { certaintyLabel, type LethalFlag } from '@optcg/ai';
import type { PlayerId } from '@optcg/engine';
import { Footer } from '../../Footer.tsx';
import { Header } from '../../Header.tsx';
import { GameController } from '../game/controller.ts';
import { Game } from '../game/Game.tsx';
import { ExplanationView } from '../coach/ExplanationView.tsx';
import { lineRefs } from '../coach/coach.ts';
import { prefixOf, startReview, type ReviewRun } from './analyse.ts';
import './review.css';

/** A flag on the timeline: a missed lethal today, any kind later (learning-ui §4.2). */
export type ReviewFlag = LethalFlag;

const SEVERITY: Record<LethalFlag['severity'], { word: string; glyph: string; size: number }> = {
  severe: { word: 'Severe', glyph: '◆', size: 20 },
  hindsight: { word: 'Hindsight', glyph: '◉', size: 14 },
  marker: { word: 'Not fully checked', glyph: '◌', size: 14 },
};

const KIND: Record<LethalFlag['kind'], string> = {
  'missed-lethal': 'Missed lethal',
  'not-fully-checked': 'Not fully checked',
};

/** "Turn 9, your turn: missed lethal, severe, holds whatever they held." */
export function flagName(f: LethalFlag): string {
  return `Turn ${f.turn}, your turn: ${KIND[f.kind].toLowerCase()}, ${SEVERITY[f.severity].word.toLowerCase()}, ${certaintyLabel(f.explanation.certainty, 'review').toLowerCase()}.`;
}

type Analysis =
  | { status: 'running'; deeper: boolean }
  | { status: 'done'; flags: LethalFlag[] }
  | { status: 'failed'; message: string };

type Screen =
  | { kind: 'overview' }
  | { kind: 'study'; ctl: GameController }
  | { kind: 'play'; ctl: GameController; puzzle: boolean };

export function ReviewFlow({
  ctl,
  onBackToGame,
  onHome,
}: {
  ctl: GameController;
  /** Leave the review for the finished game's board. */
  onBackToGame: () => void;
  onHome: () => void;
}) {
  const [analysis, setAnalysis] = useState<Analysis>({ status: 'running', deeper: false });
  const [sel, setSel] = useState(0);
  const [screen, setScreen] = useState<Screen>({ kind: 'overview' });
  const run = useRef<ReviewRun | null>(null);
  const record = useMemo(() => ctl.session.exportRecord(), [ctl]);
  const humans = useMemo(
    () => (['p1', 'p2'] as PlayerId[]).filter((p) => ctl.seatOf(p) === 'human'),
    [ctl],
  );

  const analyse = (deeper: boolean) => {
    setAnalysis({ status: 'running', deeper });
    begin(deeper);
  };
  const begin = (deeper: boolean) => {
    run.current?.cancel();
    const r = startReview({
      record,
      // The game is over: every card in it is fair to send.
      cards: [...ctl.cards.values()],
      seats: humans,
      ...(deeper ? { nodes: 1_500_000 } : {}),
    });
    run.current = r;
    r.promise.then(
      (flags) => {
        if (run.current !== r) return;
        setAnalysis({ status: 'done', flags });
        setSel(0);
      },
      (e: unknown) => {
        if (run.current !== r) return;
        setAnalysis({ status: 'failed', message: e instanceof Error ? e.message : String(e) });
      },
    );
  };
  useEffect(() => {
    begin(false);
    return () => run.current?.cancel();
    // The review of one finished game runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flags = analysis.status === 'done' ? analysis.flags : [];
  // Marker turns ("not fully checked") are not flags: they sit on the timeline only.
  const real = flags.filter((f) => f.kind === 'missed-lethal');
  const flag = real[Math.min(sel, real.length - 1)] ?? null;

  const restore = (f: LethalFlag, puzzle: boolean, readOnly: boolean): GameController => {
    const prefix = prefixOf(record, f.actionIndex);
    return new GameController(ctl.cards, prefix.start, {
      ...ctl.config,
      mode: 'ai',
      human: f.player,
      startPaused: false,
      restore: {
        record: prefix,
        ...(readOnly ? { readOnly: true } : {}),
        ...(puzzle ? { puzzle: { turn: f.turn } } : {}),
      },
    });
  };
  const open = (f: LethalFlag, kind: 'study' | 'play' | 'practice') => {
    const c = restore(f, kind === 'practice', kind === 'study');
    if (kind !== 'study') c.start();
    setScreen(
      kind === 'study'
        ? { kind: 'study', ctl: c }
        : { kind: 'play', ctl: c, puzzle: kind === 'practice' },
    );
  };
  const close = () => {
    if (screen.kind !== 'overview') screen.ctl.dispose();
    setScreen({ kind: 'overview' });
  };

  // L-SR4: "Practice this" and "Play from here" swap the whole screen, so the button that held
  // focus is gone and the new <Game> starts with nothing to rescue. Put focus on the new
  // decision's heading and say where the player is, once the board has mounted.
  const playing = screen.kind === 'play' ? screen : null;
  const playTurn = flag?.turn ?? 0;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      document.getElementById('decision-title')?.focus();
      playing.ctl.announce(
        playing.puzzle
          ? `Practice: turn ${playTurn} as it stood. Nothing is timed. Find the win you missed.`
          : `Playing from turn ${playTurn}, as it stood.`,
      );
    }, 150);
    return () => clearTimeout(t);
  }, [playing, playTurn]);

  if (screen.kind === 'study' && flag) {
    const idx = real.indexOf(flag);
    return (
      <Study
        ctl={screen.ctl}
        flag={flag}
        at={idx}
        count={real.length}
        step={(d) => {
          const next = real[idx + d];
          if (!next) return;
          screen.ctl.dispose();
          setSel(idx + d);
          const c = restore(next, false, true);
          setScreen({ kind: 'study', ctl: c });
        }}
        onBack={close}
        onPlay={() => {
          screen.ctl.dispose();
          open(flag, 'play');
        }}
        onPractice={() => {
          screen.ctl.dispose();
          open(flag, 'practice');
        }}
        onHome={onHome}
      />
    );
  }
  if (screen.kind === 'play') {
    return (
      <Game
        key={`${screen.puzzle ? 'practice' : 'play'}-${flag?.turn ?? 0}-${screen.ctl.session.seed}`}
        ctl={screen.ctl}
        onHome={close}
        onNewGame={close}
        onRematch={close}
        onReview={close}
        reviewLabel="Back to the review"
      />
    );
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <Overview
        ctl={ctl}
        analysis={analysis}
        flags={flags}
        real={real}
        flag={flag}
        sel={sel}
        setSel={setSel}
        onStudy={() => flag && open(flag, 'study')}
        onPlay={() => flag && open(flag, 'play')}
        onPractice={() => flag && open(flag, 'practice')}
        onDeeper={() => analyse(true)}
        onBack={onBackToGame}
      />
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------------

function Overview({
  ctl,
  analysis,
  flags,
  real,
  flag,
  sel,
  setSel,
  onStudy,
  onPlay,
  onPractice,
  onDeeper,
  onBack,
}: {
  ctl: GameController;
  analysis: Analysis;
  flags: LethalFlag[];
  real: LethalFlag[];
  flag: LethalFlag | null;
  sel: number;
  setSel: (i: number) => void;
  onStudy: () => void;
  onPlay: () => void;
  onPractice: () => void;
  onDeeper: () => void;
  onBack: () => void;
}) {
  const view = ctl.view();
  const me = ctl.me;
  const names = ctl.names();
  const turns = useMemo(() => ctl.session.turns(), [ctl]);
  const r = view.result;
  const result = r
    ? 'winner' in r
      ? r.winner === me
        ? 'You won'
        : 'You lost'
      : 'Draw'
    : 'Unfinished';
  const severe = real.filter((f) => f.severity === 'severe').length;
  const unchecked = flags.filter((f) => f.kind === 'not-fully-checked').length;
  const status =
    analysis.status === 'running'
      ? analysis.deeper
        ? 'Analysing deeper…'
        : 'Analysing your turns…'
      : analysis.status === 'failed'
        ? `The analysis stopped: ${analysis.message}`
        : real.length === 0 && unchecked === 0
          ? 'Analysed: no missed lethal found.'
          : `${real.length} ${real.length === 1 ? 'flag' : 'flags'}${severe ? ` · ${severe} severe` : ''}${unchecked ? ` · ${unchecked} not fully checked` : ''}`;

  const byTurn = new Map(flags.map((f) => [f.turn, f]));
  const tl = useRef<HTMLOListElement>(null);
  // The review screen is a new page: focus its heading (the button that opened it, or the board
  // that was left, is gone), so it is never left on <body> (L-SR4).
  useEffect(() => {
    document.getElementById('rv-title')?.focus();
  }, []);
  // L-SR3: choosing a flag by N, Shift+N, the timeline or the table is said, not silent.
  const [said, setSaid] = useState({ n: 0, text: '' });
  const choose = (i: number) => {
    setSel(i);
    const f = real[i];
    if (f)
      setSaid((x) => ({
        n: x.n + 1,
        text: `Flag ${i + 1} of ${real.length} selected. ${flagName(f)}`,
      }));
  };
  // Left and Right move between turns on the timeline; N and Shift+N between flags (learning-ui §4.2).
  const onKey = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
    if ((e.key === 'n' || e.key === 'N') && real.length > 0) {
      e.preventDefault();
      choose((sel + (e.shiftKey ? real.length - 1 : 1)) % real.length);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const cols = [...(tl.current?.querySelectorAll<HTMLElement>('.tl-col') ?? [])];
      const i = cols.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      e.preventDefault();
      cols[Math.max(0, Math.min(cols.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus();
    }
  };
  const did = flag ? whatYouDid(ctl, flag) : '';

  return (
    <main id="main" className="review" aria-labelledby="rv-title" onKeyDown={onKey}>
      <div className="rv-head">
        <h1 id="rv-title" tabIndex={-1}>
          Game review
        </h1>
        <p className="rv-sub">
          {result}
          {` · turn ${view.turn.number} · against ${names.player[ctl.config.human === 'p1' ? 'p2' : 'p1'] || 'the AI'}`}
          {ctl.session.rewound && <span className="chip outline"> Rewound</span>}
        </p>
        <button type="button" className="btn small" onClick={onBack}>
          <span aria-hidden="true">← </span>Back to the board
        </button>
      </div>
      <p className="rv-status" role="status" aria-live="polite" data-testid="review-status">
        {status}
        {analysis.status === 'done' && unchecked > 0 && (
          <>
            {' '}
            <button type="button" className="linkbtn" onClick={onDeeper}>
              Analyse deeper
            </button>
          </>
        )}
      </p>

      <section aria-labelledby="rv-tl-h" className="rv-card">
        <h2 id="rv-tl-h">Turn timeline</h2>
        {/* L-SR3: NVDA's browse mode keeps the arrows and N outside an application region, so the
            timeline is one (the decision footer's pattern, M3 F2). Tab and Enter reach every
            action without them: the flagged turns and the Flags table are tab stops. */}
        <div
          role="application"
          aria-roledescription="turn timeline"
          aria-label="Turn timeline. Left and Right arrows move between turns, N between flags."
        >
          <ol className="tl" ref={tl} aria-label="Turns, left to right">
            <li className="tl-axis" aria-hidden="true">
              <span>You</span>
            </li>
            {turns.map((t, i) => {
              const mine = t.player === me;
              const f = mine ? byTurn.get(t.turn) : undefined;
              const s = f ? SEVERITY[f.severity] : null;
              const idx = f ? real.indexOf(f) : -1;
              return (
                <li key={t.turn} className={`tl-col ${mine ? 'mine' : 'theirs'}`}>
                  <button
                    type="button"
                    className="tl-col"
                    tabIndex={i === 0 || f ? 0 : -1}
                    aria-current={idx >= 0 && idx === sel ? 'true' : undefined}
                    onClick={() => idx >= 0 && choose(idx)}
                  >
                    <span className="tl-turn">
                      T{t.turn} · {mine ? 'You' : 'Opp'}
                    </span>
                    <span
                      className={`tl-cell ${f ? `sev-${f.severity}` : ''} ${analysis.status === 'running' && mine ? 'hatched' : ''}`}
                    >
                      {s && (
                        <span className="tl-flag" style={{ fontSize: s.size }} aria-hidden="true">
                          {s.glyph}
                        </span>
                      )}
                      {s && <span className="tl-word">{s.word}</span>}
                    </span>
                    <span className="sr-only">
                      {f
                        ? `. ${flagName(f)}`
                        : mine && analysis.status === 'running'
                          ? '. Not analysed yet.'
                          : mine
                            ? '. No flag.'
                            : '.'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="sr-only" role="status" aria-live="polite" data-testid="review-announce">
          {said.text && <p key={said.n}>{said.text}</p>}
        </div>
        <p className="subtle rv-legend">
          ◆ Missed lethal (severe) · ◉ Hindsight · ◌ Not fully checked · hatched: not analysed yet.
          Opponent moves and the Life line arrive with full Game Review.
        </p>
      </section>

      <section aria-labelledby="rv-fl-h" className="rv-card">
        <h2 id="rv-fl-h">Flags</h2>
        {real.length === 0 ? (
          <p className="subtle">
            {analysis.status === 'running'
              ? 'Looking for turns where you had lethal…'
              : 'No flags. A turn where you had lethal and did not win would be listed here.'}
          </p>
        ) : (
          <table className="rv-table">
            <thead>
              <tr>
                <th scope="col">Turn</th>
                <th scope="col">Kind</th>
                <th scope="col">Severity</th>
                <th scope="col">Certainty</th>
              </tr>
            </thead>
            <tbody>
              {real.map((f, i) => (
                <tr key={f.turn} aria-selected={i === sel}>
                  <th scope="row">
                    <button
                      type="button"
                      className="linkbtn"
                      aria-label={flagName(f)}
                      aria-current={i === sel ? 'true' : undefined}
                      onClick={() => choose(i)}
                    >
                      Turn {f.turn}
                    </button>
                  </th>
                  <td>{KIND[f.kind]}</td>
                  <td>
                    <span aria-hidden="true">{SEVERITY[f.severity].glyph} </span>
                    {SEVERITY[f.severity].word}
                  </td>
                  <td>{certaintyLabel(f.explanation.certainty, 'review')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {flag && (
        <section
          aria-labelledby="rv-sel-h"
          className="rv-card rv-detail"
          data-testid="selected-flag"
        >
          <h2 id="rv-sel-h">Selected flag · turn {flag.turn}</h2>
          <p className="rv-did">
            <b>What you did:</b> {did}
          </p>
          <ExplanationView
            ex={flag.explanation}
            context="review"
            verbosity="learner"
            idPrefix="rv-ex"
            headingLevel={3}
          />
          <div className="rv-foot">
            <button type="button" className="btn primary" id="study-btn" onClick={onStudy}>
              Study this moment
            </button>
            <button type="button" className="btn" id="play-from-btn" onClick={onPlay}>
              Play from here
            </button>
            <button type="button" className="btn" id="practice-btn" onClick={onPractice}>
              Practice this
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

/** One line of what the player did on the flagged turn, from the game's own log. */
function whatYouDid(ctl: GameController, f: LethalFlag): string {
  const lines = ctl.logLines();
  const out: string[] = [];
  let nextTurnAt = Infinity;
  for (const l of lines)
    if (l.kind === 'turn' && l.index > f.actionIndex) nextTurnAt = Math.min(nextTurnAt, l.index);
  for (const l of lines)
    if (
      l.kind === 'move' &&
      l.actor === f.player &&
      !l.auto &&
      l.index >= f.actionIndex &&
      l.index < nextTurnAt
    )
      out.push(l.text);
  if (out.length === 0) return 'Nothing: the game ended before you played.';
  return out.slice(0, 6).join(' · ') + (out.length > 6 ? ' · …' : '');
}

// ---------------------------------------------------------------------------------------------
// Study: the restored board, read-only, with the explanation in the rail (learning-ui §4.1)
// ---------------------------------------------------------------------------------------------

function Study({
  ctl,
  flag,
  at,
  count,
  step,
  onBack,
  onPlay,
  onPractice,
  onHome,
}: {
  ctl: GameController;
  flag: LethalFlag;
  at: number;
  count: number;
  step: (delta: -1 | 1) => void;
  onBack: () => void;
  onPlay: () => void;
  onPractice: () => void;
  onHome: () => void;
}) {
  // Show lights cards by their handles in the player's view: only the `public` proof names them
  // that way (a Hindsight line is searched on the full state, with engine ids).
  const refs = useMemo(
    () => (flag.severity === 'severe' ? lineRefs(flag.public, ctl.view()) : []),
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
      } else if (e.key === 'n' || e.key === 'N') step(e.shiftKey ? -1 : 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
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
          Flag {at + 1} of {count}
        </span>
        <button
          type="button"
          className="iconbtn"
          aria-label="Previous flag (Shift+N)"
          disabled={at === 0}
          onClick={() => step(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="iconbtn"
          aria-label="Next flag (N)"
          disabled={at >= count - 1}
          onClick={() => step(1)}
        >
          ›
        </button>
      </div>
      <p className="study-note">
        Turn {flag.turn}, as it stood when your Main Phase began. Read-only: nothing here is played.
      </p>
      <div className="study-body">
        <ExplanationView
          ex={flag.explanation}
          context="review"
          verbosity="learner"
          idPrefix="study-ex"
          headingLevel={2}
          {...(refs.length > 0
            ? { onShow: (i: number) => ctl.coach.lightRefs(refs[i] ?? [], i) }
            : {})}
        />
      </div>
      <div className="study-foot">
        <button type="button" className="btn" id="play-from-btn" onClick={onPlay}>
          Play from here
        </button>
        <button type="button" className="btn primary" id="practice-btn" onClick={onPractice}>
          Practice this
        </button>
      </div>
    </div>
  );
  return <Game ctl={ctl} onHome={onHome} onNewGame={onBack} onRematch={onBack} studyRail={rail} />;
}
