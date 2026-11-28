/**
 * `/drills/:drill` (M9 WP4; flows F19): the start screen. Filters (archetype, seat, source), how
 * many items, and the timer. Untimed is the default. Starting opens `/drills/:drill/run` with the
 * choices in the address, so a session can be linked and a reload gives the same items.
 */
import { useEffect, useState } from 'react';
import { ARCHETYPES } from '../play/setup/decks.ts';
import { lessonName } from '../play/coach/ExplanationView.tsx';
import { displayName } from '../meta/model.ts';
import { Link, navigate, useSearch } from '../router.tsx';
import { drillOfPath, queryOf } from './DrillRun.tsx';
import { EXIT } from './session.ts';
import { BASE_SECONDS, factorOfPercent, limitWords, TIMER_CHOICES } from './timer.ts';
import { DEFAULT_COUNT, DRILL_LESSON, DRILL_NAMES, SESSION_COUNTS } from './types.ts';
import './drills.css';

export default function DrillStart({ path }: { path: string }) {
  const drill = drillOfPath(path);
  const q = queryOf(useSearch());
  const [archetype, setArchetype] = useState(q.archetype ?? '');
  const [seat, setSeat] = useState<string>(q.seat ?? '');
  const [source, setSource] = useState<string>(q.source ?? 'mine');
  const [count, setCount] = useState(q.count ?? DEFAULT_COUNT);
  const [factor, setFactor] = useState<number | null>(factorOfPercent(q.timer));
  useEffect(() => {
    document.title = `${drill ? DRILL_NAMES[drill] : 'Drill'} · OPTCG Sim`;
    document.getElementById('page-title')?.focus();
  }, [drill]);
  if (!drill)
    return (
      <main className="page" id="main" aria-labelledby="page-title" data-path={path}>
        <h1 id="page-title" tabIndex={-1}>
          That drill does not exist
        </h1>
        <p>
          <Link to="/drills">Back to the drills</Link>
        </p>
      </main>
    );
  const exit = EXIT[drill];
  const start = () => {
    const p = new URLSearchParams();
    if (archetype) p.set('archetype', archetype);
    if (seat) p.set('seat', seat);
    p.set('source', source);
    p.set('count', String(count));
    if (factor !== null) p.set('timer', String(Math.round(factor * 100)));
    navigate(`/drills/${drill}/run?${p}`);
  };
  return (
    <main className="page drills" id="main" aria-labelledby="page-title" data-path={path}>
      <h1 id="page-title" tabIndex={-1}>
        {DRILL_NAMES[drill]}
      </h1>
      <p className="lede">
        Lesson: <Link to={`/learn/${DRILL_LESSON[drill]}`}>{lessonName(DRILL_LESSON[drill])}</Link>.
        You pass with {exit.needed} of {exit.of}, untimed.
      </p>
      {drill === 'mulligan' && (
        <p className="subtle">
          A deck with no sourced mulligan rule has no items here; picking it says so.
        </p>
      )}
      <form
        className="drill-form"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <div>
          <label htmlFor="d-arch">Archetype</label>
          <select
            id="d-arch"
            className="input"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
          >
            <option value="">Any</option>
            {ARCHETYPES.map((a) => (
              <option key={a.id} value={a.id}>
                {displayName(a.leaderId)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="d-seat">Seat</label>
          <select
            id="d-seat"
            className="input"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
          >
            <option value="">Either</option>
            <option value="first">Going first</option>
            <option value="second">Going second</option>
          </select>
        </div>
        <div>
          <label htmlFor="d-source">Items from</label>
          <select
            id="d-source"
            className="input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="mine">My games first, then the bank</option>
            <option value="bank">The bank only</option>
          </select>
        </div>
        <div>
          <label htmlFor="d-count">Items</label>
          <select
            id="d-count"
            className="input"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {SESSION_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="d-timer">Time allowed</label>
          <select
            id="d-timer"
            className="input"
            value={factor === null ? '' : String(factor)}
            onChange={(e) => setFactor(e.target.value === '' ? null : Number(e.target.value))}
            aria-describedby="d-timer-note"
          >
            {TIMER_CHOICES.map((c) => (
              <option key={c.label} value={c.factor === null ? '' : String(c.factor)}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="subtle" id="d-timer-note">
            {limitWords(drill, factor)}. At 100% an item has {BASE_SECONDS[drill]} s. Time never
            ends an item.
          </p>
        </div>
        <p>
          <button type="submit" className="btn primary">
            Start
          </button>
        </p>
      </form>
    </main>
  );
}
