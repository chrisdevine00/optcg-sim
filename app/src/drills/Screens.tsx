/**
 * The screens around an item: the answer, the summary and the leave dialog. Each heading takes
 * focus when its screen appears; right and wrong are words and a shape, never colour alone.
 */
import { useEffect, useRef } from 'react';
import { ExplanationView } from '../play/coach/ExplanationView.tsx';
import { Link } from '../router.tsx';
import type { AnswerView } from './answers.ts';
import type { Summary } from './session.ts';
import type { DrillId } from './types.ts';
import { DRILL_LESSON, DRILL_NAMES } from './types.ts';

const SHAPE = (a: AnswerView): string =>
  a.title === 'Correct' ? '✓' : a.title === 'Answer shown' ? '◌' : '✗';

export function AnswerScreen({
  view,
  last,
  onNext,
}: {
  view: AnswerView;
  last: boolean;
  onNext(): void;
}) {
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    head.current?.focus();
  }, []);
  // Enter goes on, unless focus is on something that uses Enter itself (a button, a link, a summary).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(BUTTON|A|SUMMARY|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      e.preventDefault();
      onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);
  return (
    <main
      className="page page-full drill"
      id="main"
      aria-labelledby="page-title"
      data-answer={view.title}
    >
      <h1
        id="page-title"
        tabIndex={-1}
        ref={head}
        className={view.correct ? 'drill-right' : 'drill-wrong'}
      >
        <span aria-hidden="true">{SHAPE(view)} </span>
        {view.title}
      </h1>
      {view.lines.map((l, i) => (
        <p key={i} className="drill-answer-line">
          {l}
        </p>
      ))}
      {view.handLabel && (
        <p className="drill-answer-line" data-testid="hand-label">
          <span aria-hidden="true">◐ </span>
          {view.handLabel}
        </p>
      )}
      {view.explanation ? (
        <ExplanationView
          ex={view.explanation}
          context={view.context}
          verbosity="learner"
          idPrefix="drill-ex"
          headingLevel={2}
          archetype={view.archetype}
          lessonLinks
        />
      ) : (
        <p className="subtle">There is no more to say about this one.</p>
      )}
      <p className="drill-next">
        <button type="button" className="btn primary" onClick={onNext}>
          {last ? 'See summary' : 'Next'} <kbd>Enter</kbd>
        </button>
      </p>
    </main>
  );
}

export function SummaryScreen({
  drill,
  summary,
  archetypeName,
  dropped,
  again,
}: {
  drill: DrillId;
  summary: Summary;
  archetypeName: string | null;
  dropped: string | null;
  again(): void;
}) {
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    head.current?.focus();
  }, []);
  const mark = summary.passed === null ? '◌' : summary.passed ? '✓' : '✗';
  return (
    <main className="page page-full drill" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1} ref={head}>
        {DRILL_NAMES[drill]}: summary
      </h1>
      <p className="drill-score" data-testid="drill-score">
        <span aria-hidden="true">{mark} </span>
        <b>{summary.headline}</b>
        {archetypeName ? ` (${archetypeName})` : ''}
      </p>
      <p>{summary.detail}</p>
      {summary.shown > 0 && (
        <p>
          You asked to see {summary.shown === 1 ? '1 answer' : `${summary.shown} answers`}; those
          counted as not correct.
        </p>
      )}
      {summary.timed && (
        <p data-testid="drill-timed">
          <span aria-hidden="true">{summary.timed.passed ? '✓ ' : '◌ '}</span>
          {summary.timed.line}
        </p>
      )}
      {dropped && <p className="subtle">{dropped}</p>}
      <p className="drill-next">
        <button type="button" className="btn primary" onClick={again}>
          Another set
        </button>{' '}
        <Link className="btn" to={`/learn/${DRILL_LESSON[drill]}`}>
          Back to the lesson
        </Link>{' '}
        <Link className="btn" to="/drills">
          All drills
        </Link>
      </p>
    </main>
  );
}

/** "Leave drill? Your session is saved up to here." Esc keeps going; focus returns to where it was. */
export function LeaveDialog({ onStay, onLeave }: { onStay(): void; onLeave(): void }) {
  const stay = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    stay.current?.focus();
    return () => {
      if (before?.isConnected) before.focus();
    };
  }, []);
  return (
    <div className="drill-scrim">
      <div
        className="drill-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        ref={box}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onStay();
          } else if (e.key === 'Tab') {
            const els = [...box.current!.querySelectorAll<HTMLElement>('button')];
            const i = els.indexOf(document.activeElement as HTMLElement);
            e.preventDefault();
            els[(i + (e.shiftKey ? els.length - 1 : 1)) % els.length]?.focus();
          }
        }}
      >
        <h2 id="leave-title">Leave drill?</h2>
        <p>Your session is saved up to here.</p>
        <p>
          <button type="button" className="btn" ref={stay} onClick={onStay}>
            Keep going
          </button>{' '}
          <button type="button" className="btn" onClick={onLeave}>
            Leave
          </button>
        </p>
      </div>
    </div>
  );
}
