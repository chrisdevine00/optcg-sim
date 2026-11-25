/**
 * The Hint section (learning-ui §2.4, flows F9) and the "staged by the coach" note. A hint is a
 * line, not a move; it runs only on a press (H or the button), from the player's own view, in the
 * coach's own worker. "Do step 1" lines the first action up and the player still commits it.
 */
import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Action } from '@optcg/engine';
import { actionKey, type HintResult } from '@optcg/ai';
import type { G } from '../game/ui.ts';
import { counterOptions } from '../rail/Decision.tsx';
import { ExplanationView } from './ExplanationView.tsx';

/** The decision is one the planner stages (a Block or Counter step). */
const isDefence = (g: G): boolean => {
  const k = g.view.decision?.kind;
  return g.mine && (k === 'block' || k === 'counter');
};

/** "Stage this" on a defence: the hint's Blocker and Counters into the defence planner. */
function stageDefence(g: G, r: HintResult): void {
  const block = r.viewActions.find((a) => a.type === 'block');
  const blocker = block && block.type === 'block' ? block.blocker : null;
  const opts = counterOptions(g, { blocker, counters: [] });
  const target = blocker ?? g.view.battle?.target ?? '';
  const counters = r.viewActions.flatMap((a) =>
    a.type === 'counter' && opts.has(a.card) ? [{ card: a.card, target }] : [],
  );
  g.setStaging({ blocker, counters });
  const n = counters.length;
  g.ctl.announce(
    `Staged the hint: ${blocker ? `block with ${g.nameOf(blocker)}` : 'no block'}, ${n} ${n === 1 ? 'Counter' : 'Counters'}. Check it in the decision panel, then commit.`,
  );
}

/** Words for the one action the coach has lined up. */
export function stagedText(g: G, a: Action): string {
  const who = (h: string) => (g.cardOf(h)?.zone === 'leader' ? 'a Leader' : g.nameOf(h));
  switch (a.type) {
    case 'playCard':
      return `Play ${g.nameOf(a.card)}`;
    case 'giveDon':
      return `Give 1 DON!! to ${who(a.target)}`;
    case 'attack':
      return `Attack ${who(a.target)} with ${who(a.attacker)}`;
    case 'activate':
      return `Use ${who(a.card)}`;
    case 'pick':
      return typeof a.choice === 'string' ? `Choose ${who(a.choice)}` : 'Choose';
    case 'endTurn':
      return 'End your turn';
    default:
      return a.type;
  }
}

/**
 * The action "Do step 1" lined up, shown in the decision panel next to the controls that commit.
 * Nothing happens until the player presses "Do it": the player still commits.
 */
export function StagedNote({ g }: { g: G }) {
  const a = g.ctl.staged;
  if (!a || !g.mine) return null;
  const k = actionKey(a);
  // A stale staging (the position moved on) is not offered.
  if (!g.ctl.actions().some((x) => actionKey(x) === k)) return null;
  return (
    <div className="staged-note" role="group" aria-label="Lined up by the coach">
      <p>
        Lined up by the coach: <b>{stagedText(g, a)}</b>
      </p>
      <div className="coach-actions">
        <button
          type="button"
          id="coach-staged-commit"
          className="btn small primary"
          onClick={() => g.ctl.act(a)}
        >
          Do it
        </button>
        <button type="button" className="btn small" onClick={() => g.ctl.stage(null)}>
          Clear
        </button>
      </div>
    </div>
  );
}

/** The hint, in the coach section or (when the decision panel owns the rail) in the decision. */
export function HintBody({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const h = coach.hint;
  const ref = useRef<HTMLDivElement>(null);
  const signal = coach.hintFocus;
  // H moves focus to the result (DECISIONS L-11): once per press, never when the section merely mounts.
  useEffect(() => {
    if (!coach.takeHintFocus()) return;
    const t = setTimeout(() => ref.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [signal, coach]);
  const opp = g.names.player[g.opp] || 'the opponent';
  const ask = (
    <button type="button" className="btn small primary" onClick={() => coach.askHint()}>
      {h.status === 'idle' ? 'Ask for a hint' : 'Ask again'} <kbd aria-hidden="true">H</kbd>
    </button>
  );
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="coach-result coach-hint"
      role="group"
      aria-label="Hint"
      data-hint={h.status}
    >
      {h.status === 'idle' && (
        <>
          <p className="coach-lead">
            What should I do? The coach plays your turn out and shows a line. It never moves for
            you.
          </p>
          {ask}
          {!g.mine && <p className="subtle">Ask now and it waits for {opp}’s move.</p>}
        </>
      )}
      {h.status === 'waiting' && (
        <>
          <p role="status">Waiting for {opp}’s move.</p>
          <button type="button" className="btn small" onClick={() => coach.discardHint()}>
            Stop <kbd aria-hidden="true">Esc</kbd>
          </button>
        </>
      )}
      {h.status === 'thinking' && (
        <>
          <div className="coach-checking" role="status">
            <span className="coach-bar" aria-hidden="true" />
            <span>Thinking… (Esc to stop)</span>
          </div>
          <button type="button" className="btn small" onClick={() => coach.discardHint()}>
            Stop
          </button>
        </>
      )}
      {h.status === 'failed' && (
        <>
          <p>Couldn’t find a line this time.</p>
          {ask}
        </>
      )}
      {h.status === 'ready' && h.result && <HintResultView g={g} result={h.result} ask={ask} />}
    </div>
  );
}

function HintResultView({ g, result, ask }: { g: G; result: HintResult; ask: React.ReactNode }) {
  const coach = g.ctl.coach;
  const prog = coach.hintProgress();
  const defence = isDefence(g);
  const finished = !prog.stale && result.line.length > 0 && prog.done >= result.line.length;
  const left = coach.firstStepLeft();
  const staged = g.ctl.staged !== null;
  const doStep = () => {
    if (prog.stale) return;
    if (defence) stageDefence(g, result);
    else if (coach.stageNext()) {
      g.ctl.announce('Lined up. Press Do it in the decision panel to commit, or Clear.');
      setTimeout(() => document.getElementById('coach-staged-commit')?.focus(), 60);
    }
  };
  return (
    <div className={prog.stale ? 'hint-stale' : undefined}>
      {prog.stale && (
        <p className="coach-stale" role="status">
          <span aria-hidden="true">⚠ </span>Board changed: ask again. {ask}
        </p>
      )}
      {finished && (
        <p className="coach-note" role="status">
          <span aria-hidden="true">✓ </span>You have played the whole line.
        </p>
      )}
      <ExplanationView
        ex={result.explanation}
        context="coach"
        verbosity={coach.profile.verbosity}
        idPrefix="coach-hint"
        renderLine={() => <HintLine g={g} result={result} doStep={doStep} />}
        extra={
          <div className="coach-actions">
            <button
              type="button"
              className="btn small primary"
              aria-disabled={prog.stale || (!defence && !left) || undefined}
              onClick={() => {
                if (!prog.stale && (defence || left)) doStep();
              }}
            >
              {defence ? 'Stage this' : prog.done > 0 || staged ? 'Do the next part' : 'Do step 1'}
            </button>
          </div>
        }
      />
      {result.alternatives.length > 0 && (
        <section aria-label="Other lines" className="hint-alts">
          <p className="ex-sub">Other lines</p>
          <ul className="why-evidence">
            {result.alternatives.map((a, i) => (
              <li key={i}>
                <b>{a.move.text}</b> {a.why}
              </li>
            ))}
          </ul>
        </section>
      )}
      {prog.stale ? null : (
        <p className="subtle hint-keys">
          Down and Up move through the steps, Enter shows one, Shift+Enter does step 1. Esc clears
          the hint.
        </p>
      )}
    </div>
  );
}

/** The numbered line: completed steps tick; Down and Up move between steps, Shift+Enter does step 1. */
function HintLine({ g, result, doStep }: { g: G; result: HintResult; doStep: () => void }) {
  const coach = g.ctl.coach;
  const prog = coach.hintProgress();
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const focused = useRef(0);
  const move = (to: number) => {
    const i = Math.max(0, Math.min(result.line.length - 1, to));
    focused.current = i;
    rows.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(i - 1);
    } else if (e.key === 'Enter' && e.shiftKey && i === 0) {
      e.preventDefault();
      doStep();
    }
  };
  return (
    <ol className="why-line ex-line hint-line" aria-label="The line">
      {result.line.map((m, i) => {
        const done = !prog.stale && i < prog.done;
        return (
          <li key={i} className={done ? 'done' : undefined} data-done={done || undefined}>
            <span className="ex-n" aria-hidden="true">
              {done ? '✓' : `${i + 1}.`}
            </span>
            <span className="ex-text">
              {done && <span className="sr-only">Done: </span>}
              {m.text}
            </span>
            <button
              type="button"
              className="linkbtn ex-show"
              ref={(el) => {
                rows.current[i] = el;
              }}
              tabIndex={i === 0 ? 0 : -1}
              aria-label={`Show step ${i + 1} on the board: ${m.text}`}
              onFocus={() => (focused.current = i)}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => coach.showHint(i)}
            >
              Show
            </button>
          </li>
        );
      })}
    </ol>
  );
}
