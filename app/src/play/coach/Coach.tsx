/**
 * The coach panel (learning-ui §2.1, board.md §3.13): a strip in the rail between the log and the
 * decision panel, opening to a section (Why or Lethal), or tall for tier 3 and the guided count.
 * It never takes focus, opens by itself or makes a sound unless the player asked (§2.2): the only
 * unprompted signals are the Lethal button's badge and a polite line, and only when the player has
 * switched the detector on.
 */
import { useEffect, useRef } from 'react';
import type { Explanation } from '@optcg/ai';
import type { G } from '../game/ui.ts';
import { num } from '../game/text.ts';
import { CertaintyChip, ExplanationView } from './ExplanationView.tsx';
import type { GuidedState, Tier } from './coach.ts';
import type { AlwaysOn } from './profile.ts';
import { lethalBadge } from './badge.ts';
import './coach.css';

export type CoachMode = 'strip' | 'open' | 'tall';

export const STRIP_H = 48;

export function CoachPanel({
  g,
  top,
  height,
  mode,
  onWhy,
}: {
  g: G;
  top: number;
  height: number;
  mode: CoachMode;
  /** Open the last AI move's explanation (W). */
  onWhy: () => void;
}) {
  const coach = g.ctl.coach;
  const resultRef = useRef<HTMLDivElement>(null);
  const { profile } = coach;
  const open = mode !== 'strip';
  const badge = lethalBadge(coach);
  const canLethal = coach.supported;
  const hasWhy = g.ctl.lastWhy() !== null && !g.ctl.hotseat;

  // Focus goes to the section's result only when the player pressed a coach key (§2.1).
  const signal = coach.focusSignal;
  useEffect(() => {
    if (signal === 0) return;
    const t = setTimeout(() => {
      // In the guided count, focus goes to the current question (accessibility §4.3).
      const q = document.querySelector<HTMLElement>('.guided-q');
      (q ?? resultRef.current)?.focus();
    }, 40);
    return () => clearTimeout(t);
  }, [signal]);

  return (
    <section
      className={`coach ${mode}`}
      style={{ top, height }}
      aria-label="Coach"
      data-mode={mode}
    >
      <div className="coach-strip" role="group" aria-label="Coach sections">
        {hasWhy && (
          <button
            type="button"
            className="coach-btn"
            aria-pressed={open && profile.tab === 'why'}
            onClick={() => {
              if (open && profile.tab === 'why') coach.toggle();
              else coach.setProfile({ expanded: true, tab: 'why' });
            }}
          >
            Why
          </button>
        )}
        {canLethal && (
          <button
            type="button"
            className="coach-btn"
            id="coach-lethal"
            aria-pressed={open && profile.tab === 'lethal'}
            aria-keyshortcuts="L"
            onClick={() => {
              // A press of the button is a press of L: it reveals the next tier.
              coach.press();
            }}
          >
            Lethal
            {badge && (
              <span className="coach-badge" data-testid="lethal-badge">
                {badge.glyph && <span aria-hidden="true">{badge.glyph} </span>}
                {badge.text}
              </span>
            )}
            <kbd aria-hidden="true">L</kbd>
          </button>
        )}
        <span className="spacer" />
        <button
          type="button"
          className="iconbtn coach-chevron"
          aria-expanded={open}
          aria-controls="coach-body"
          aria-label={open ? 'Collapse the coach (C)' : 'Open the coach (C)'}
          aria-keyshortcuts="C"
          onClick={() => coach.toggle()}
        >
          {open ? '▾' : '▴'}
        </button>
      </div>
      {open && (
        <div className="coach-body" id="coach-body">
          {profile.tab === 'why' ? (
            <WhySection g={g} resultRef={resultRef} onWhy={onWhy} />
          ) : (
            <LethalSection g={g} resultRef={resultRef} />
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Why
// ---------------------------------------------------------------------------------------------

function WhySection({
  g,
  resultRef,
  onWhy,
}: {
  g: G;
  resultRef: React.RefObject<HTMLDivElement | null>;
  onWhy: () => void;
}) {
  const i = g.ctl.lastWhy();
  const ex: Explanation | null = i === null ? null : g.ctl.whyAt(i);
  return (
    <div ref={resultRef} tabIndex={-1} className="coach-result" aria-label="Why the AI did that">
      {!ex ? (
        <p className="subtle">No AI move to explain yet.</p>
      ) : (
        <>
          <ExplanationView
            ex={ex}
            context="ai-why"
            verbosity={g.ctl.coach.profile.verbosity}
            idPrefix="coach-why"
          />
          <button type="button" className="linkbtn" onClick={onWhy}>
            Open in a window (W)
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Lethal
// ---------------------------------------------------------------------------------------------

const ALWAYS: { v: AlwaysOn; label: string }[] = [
  { v: 0, label: 'Ask me' },
  { v: 1, label: 'Tier 1 always on' },
  { v: 2, label: 'Tier 2 always on' },
];

function LethalSection({
  g,
  resultRef,
}: {
  g: G;
  resultRef: React.RefObject<HTMLDivElement | null>;
}) {
  const coach = g.ctl.coach;
  const { lethal, guided, profile } = coach;
  const t1 = coach.tier1();
  const tier: Tier = lethal.tier;
  const settings = (
    <label className="coach-setting">
      <span>Detector</span>
      <select
        value={profile.alwaysOn}
        onChange={(e) => coach.setAlwaysOn(Number(e.target.value) as AlwaysOn)}
      >
        {ALWAYS.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const donMath = (
    <label className="coach-setting coach-check">
      <input
        type="checkbox"
        checked={profile.donMath}
        onChange={(e) => coach.setProfile({ donMath: e.target.checked })}
      />
      <span>DON!! math on the board</span>
    </label>
  );
  // One tree for every state, with the detector setting in the same slot, so changing it (which
  // re-renders this section) never remounts the control or drops the keyboard's place in it.
  const unavailable = !lethal.key;
  const label = guided ? 'Count it with me' : 'Lethal';
  return (
    <div ref={resultRef} tabIndex={-1} className="coach-result" role="group" aria-label={label}>
      <div className="coach-state">
        {unavailable && (
          <p className="subtle">
            {g.ctl.hotseat
              ? 'The lethal detector is for games against the AI.'
              : 'Available in your Main Phase, once it is your move.'}
          </p>
        )}
        {!unavailable && guided && <GuidedCount g={g} guided={guided} />}
        {!unavailable && !guided && tier === 0 && lethal.status === 'idle' && (
          <>
            <p className="coach-lead">
              Is there lethal this turn? Reveal one step at a time: whether it exists, how many
              hits, then the line.
            </p>
            <button type="button" className="btn small primary" onClick={() => coach.press()}>
              Check for lethal <kbd>L</kbd>
            </button>
          </>
        )}
        {!unavailable && !guided && lethal.status === 'checking' && (
          <div className="coach-checking" role="status">
            <span className="coach-bar" aria-hidden="true" />
            <span>Checking…</span>
          </div>
        )}
        {!unavailable && !guided && lethal.status === 'failed' && (
          <>
            <p>Couldn’t finish checking.</p>
            <button type="button" className="btn small" onClick={() => coach.retry()}>
              Check again
            </button>
          </>
        )}
        {!unavailable && !guided && lethal.status === 'ready' && t1 && tier >= 1 && tier < 3 && (
          <Tiers g={g} />
        )}
        {!unavailable && !guided && lethal.status === 'ready' && tier >= 3 && <Tier3 g={g} />}
      </div>
      {settings}
      {donMath}
    </div>
  );
}

function Tiers({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const r = coach.lethal.result!;
  const t1 = coach.tier1()!;
  const t2 = coach.tier2()!;
  const tier = coach.lethal.tier;
  return (
    <div className="coach-tiers">
      <h3 className="coach-head" data-status={t1.status}>
        <span aria-hidden="true">
          {t1.status === 'proven' ? '◆ ' : t1.status === 'refuted' ? '✕ ' : '? '}
        </span>
        {t1.text}
      </h3>
      <p className="coach-status">
        <span className="chip outline">{statusWord(t1.status)}</span>{' '}
        <CertaintyChip certainty={t1.certainty} context="coach" caveat={t1.triggerNote} />
      </p>
      {t1.triggerNote && <p className="coach-note">{t1.triggerNote}</p>}
      {tier >= 2 && (
        <p className="coach-tier2" data-testid="tier2">
          {t2.text}
        </p>
      )}
      {r.status === 'unknown' && (
        <p className="coach-note" data-testid="unknown-bound">
          {unknownBound(r.facts)}
        </p>
      )}
      {r.status === 'unknown' && (
        <button type="button" className="btn small" onClick={() => coach.retry()}>
          Check again
        </button>
      )}
      <div className="coach-actions">
        {tier === 1 && (
          <button type="button" className="btn small" onClick={() => coach.press()}>
            How many hits? <kbd>L</kbd>
          </button>
        )}
        {tier === 2 && r.status === 'proven' && (
          <button type="button" className="btn small" onClick={() => coach.startGuided()}>
            Count it with me
          </button>
        )}
        {tier === 2 && r.status !== 'unknown' && (
          <button type="button" className="btn small" onClick={() => coach.press()}>
            {r.status === 'proven' ? 'Show the line' : 'Show why'} <kbd>L</kbd>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * What the coach can still say when the search didn't finish (review L-03): the public bound on
 * their defence, the same `defenceBound` the search uses. Public facts only.
 */
export function unknownBound(f: {
  handSize: number;
  maxPerCard: number;
  blockers: readonly string[];
  noPrior: boolean;
  defenceExtras: { rests: boolean; draws: boolean };
}): string {
  const parts: string[] = [];
  if (f.handSize === 0) parts.push('They have no cards in hand');
  else
    parts.push(
      `Their ${f.handSize} ${f.handSize === 1 ? 'card' : 'cards'} in hand could add up to +${num(f.handSize * f.maxPerCard)} (+${num(f.maxPerCard)} each, ${f.noPrior ? 'a typical deck’s' : 'their usual lists’'} biggest)`,
    );
  if (f.blockers.length)
    parts.push(
      `${f.blockers.length} active ${f.blockers.length === 1 ? 'Blocker stops' : 'Blockers each stop'} one attack`,
    );
  const extras = [
    f.defenceExtras.rests && 'rest one of your Characters',
    f.defenceExtras.draws && 'draw a card',
  ].filter(Boolean);
  const more =
    f.handSize > 0 && extras.length ? ` Their Counters can also ${extras.join(' or ')}.` : '';
  return `${parts.join('; ')}.${more}`;
}

function statusWord(s: 'proven' | 'refuted' | 'unknown'): string {
  return s === 'proven' ? 'Proven' : s === 'refuted' ? 'Refuted' : 'Unknown';
}

function Tier3({ g }: { g: G }) {
  const coach = g.ctl.coach;
  const ex = coach.explanation();
  if (!ex) return null;
  const r = coach.lethal.result!;
  const t1 = coach.tier1()!;
  return (
    <div className="coach-tier3">
      <p className="coach-status">
        <span className="chip outline">{statusWord(t1.status)}</span>
      </p>
      <ExplanationView
        ex={ex}
        context="coach"
        verbosity={coach.profile.verbosity}
        idPrefix="coach-lethal"
        caveat={t1.triggerNote}
        onShow={r.line ? (i) => coach.show(i) : undefined}
        extra={t1.triggerNote ? <p className="coach-note">{t1.triggerNote}</p> : null}
      />
      <div className="coach-actions">
        {r.status === 'proven' && (
          <button type="button" className="btn small" onClick={() => coach.startGuided()}>
            Count it with me
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Count it with me (learning-ui §3.2)
// ---------------------------------------------------------------------------------------------

const QUESTIONS = [
  'How many hits do you need?',
  'Which of your cards can attack their Leader this turn?',
  'How much can they stop?',
  'Split your DON!!',
];

function GuidedCount({ g, guided }: { g: G; guided: GuidedState }) {
  const coach = g.ctl.coach;
  const d = guided.data;
  const step = guided.step;
  const mine = [...g.view.zones[g.me].leader, ...g.view.zones[g.me].characters];
  const go = (s: 1 | 2 | 3 | 4) => {
    // Entering the split starts it from the cards the player picked (or all of them, if none).
    if (s === 4 && guided.split.length === 0) {
      const refs = guided.picked.length > 0 ? guided.picked : d.attackers.map((a) => a.ref);
      coach.guide({ step: s, split: refs.map((ref) => ({ ref, don: 0 })) });
    } else coach.guide({ step: s });
    g.ctl.announce(`Question ${s}: ${QUESTIONS[s - 1]}`);
  };
  const check = guided.check;
  const mark = (ok: boolean | undefined) => (ok === undefined ? '' : ok ? '✓ ' : '✕ ');
  const budget = d.donUsed + d.donSpare;
  const used = guided.split.reduce((t, x) => t + x.don, 0);
  const setDon = (i: number, delta: number) => {
    const next = guided.split.map((x, k) =>
      k === i ? { ...x, don: Math.max(0, Math.min(10, x.don + delta)) } : x,
    );
    coach.guide({ split: next });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= guided.split.length) return;
    const next = guided.split.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    coach.guide({ split: next });
  };
  return (
    <div className="guided">
      <div className="guided-head">
        <h3 className="coach-head">Count it with me</h3>
        <span className="subtle">Question {step} of 4 · nothing is played</span>
      </div>
      <h4 className="guided-q" id="guided-q" tabIndex={-1}>
        {QUESTIONS[step - 1]}
      </h4>
      {step === 1 && (
        <div className="guided-body">
          <label className="guided-field">
            <span>Hits needed</span>
            <input
              type="number"
              min={0}
              max={12}
              inputMode="numeric"
              value={guided.hits}
              aria-describedby="guided-q"
              onChange={(e) => coach.guide({ hits: e.target.value })}
            />
          </label>
          <p className="subtle">Their Life, plus one for the hit that wins.</p>
          {check && (
            <p className={`guided-check ${check.hits.correct ? 'ok' : 'bad'}`} role="status">
              {mark(check.hits.correct)}
              {check.hits.reason}
              {d.hits.doubleAttack && ' Double Attack takes 2 Life from 2 or more Life.'}
            </p>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="guided-body">
          <div className="opts" role="group" aria-label="Your cards">
            {mine.map((c) => {
              const on = guided.picked.includes(c.handle);
              const label =
                g.cardOf(c.handle)?.zone === 'leader' ? 'Your Leader' : g.nameOf(c.handle);
              return (
                <button
                  key={c.handle}
                  type="button"
                  className="opt"
                  aria-pressed={on}
                  onClick={() =>
                    coach.guide({
                      picked: on
                        ? guided.picked.filter((x) => x !== c.handle)
                        : [...guided.picked, c.handle],
                    })
                  }
                >
                  {label} {num(c.power)}
                  {c.rested ? ' (rested)' : ''}
                </button>
              );
            })}
          </div>
          {check && (
            <p className={`guided-check ${check.attackers.correct ? 'ok' : 'bad'}`} role="status">
              {mark(check.attackers.correct)}
              {check.attackers.reason}
            </p>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="guided-body">
          <ul className="why-evidence" aria-label="What they can stop with">
            <li>
              {d.defence.blockers === 0
                ? 'No active Blockers.'
                : `${d.defence.blockers} active ${d.defence.blockers === 1 ? 'Blocker' : 'Blockers'}: each stops one attack.`}
            </li>
            {d.defence.effects.length > 0 && (
              <li>
                {d.defence.effects
                  .map((e) =>
                    e.kind === 'boost'
                      ? `+${e.amount} on a defence${e.oncePerTurn ? ', once a turn' : ''}`
                      : `−${e.amount} on one of your attackers${e.oncePerTurn ? ', once a turn' : ''}`,
                  )
                  .join('; ')}
                .
              </li>
            )}
            <li>
              {d.defence.handSize} {d.defence.handSize === 1 ? 'card' : 'cards'} in hand
              {d.defence.maxPerCard !== null
                ? `, each up to +${num(d.defence.maxPerCard)} if it is one of their deck’s biggest Counters`
                : ''}
              .
            </li>
            <li>
              <b>Each hit gives them a card.</b>{' '}
              {d.defence.cardsAtEachAttack
                .map((n, i) => `${i === 0 ? 'At your first attack' : `after ${i}`} they have ${n}`)
                .join('; ')}
              .
            </li>
          </ul>
        </div>
      )}
      {step === 4 && (
        <div className="guided-body">
          <p className="subtle">
            DON!! to give: {used} of {budget}. Order the attacks: the one that has to beat the most
            cards goes last, because every hit gives them a card.
          </p>
          <table className="tbl guided-split">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Attacker</th>
                <th scope="col">DON!!</th>
                <th scope="col">Needs / they can have</th>
              </tr>
            </thead>
            <tbody>
              {guided.split.map((x, i) => {
                const s = d.split.find((y) => y.ref === x.ref);
                const base = s ? s.power - s.don * 1000 : (g.cardOf(x.ref)?.power ?? 0);
                const power = base + x.don * 1000;
                const targetPower = s ? s.power - s.need + 1000 : 0;
                const they = d.split[Math.min(i, d.split.length - 1)]?.maxDefence ?? 0;
                const need = power - targetPower + 1000;
                const name = g.cardOf(x.ref)?.zone === 'leader' ? 'Your Leader' : g.nameOf(x.ref);
                return (
                  <tr key={x.ref}>
                    <td className="num">{i + 1}</td>
                    <td>{name}</td>
                    <td className="guided-don">
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Fewer DON!! for ${name}`}
                        onClick={() => setDon(i, -1)}
                      >
                        −
                      </button>
                      <span className="num" aria-live="off">
                        {x.don}
                      </span>
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`More DON!! for ${name}`}
                        onClick={() => setDon(i, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Move ${name} earlier`}
                        onClick={() => move(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Move ${name} later`}
                        onClick={() => move(i, 1)}
                      >
                        ↓
                      </button>
                    </td>
                    <td className="num">
                      {s ? `needs ${num(need)} · they can have ${num(they)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {check && (
            <p className={`guided-check ${check.split.correct ? 'ok' : 'bad'}`} role="status">
              {mark(check.split.correct)}
              {check.split.reason}
            </p>
          )}
        </div>
      )}
      <div className="coach-actions guided-nav">
        <button
          type="button"
          className="btn small"
          disabled={step === 1}
          onClick={() => go((step - 1) as 1 | 2 | 3 | 4)}
        >
          Back
        </button>
        {step < 4 && (
          <button
            type="button"
            className="btn small"
            onClick={() => go((step + 1) as 1 | 2 | 3 | 4)}
          >
            Next
          </button>
        )}
        <button type="button" className="btn small primary" onClick={() => coach.checkCount()}>
          Check my count
        </button>
        <button type="button" className="btn small" onClick={() => coach.showLine()}>
          Show the line
        </button>
        <button type="button" className="btn small" onClick={() => coach.endGuided()}>
          Close
        </button>
      </div>
    </div>
  );
}
