/**
 * `/drills` (M9 WP4): the four drills, each with its lesson and what it asks. Every one opens its
 * start screen; the lesson link says how it is passed.
 */
import { useEffect } from 'react';
import { Link } from '../router.tsx';
import { DRILL_LESSON, DRILL_NAMES, DRILL_SLUGS, type DrillId } from './types.ts';
import { EXIT } from './session.ts';
import { lessonName } from '../play/coach/ExplanationView.tsx';
import './drills.css';

const ASKS: Record<DrillId, string> = {
  mulligan: 'Keep or redraw a dealt hand, judged by the sourced guide of the deck.',
  lethal: 'Find the turn that wins against any hand they could hold, or say there is none.',
  counter: 'An attack is coming: counter it, or take it and keep your cards.',
  don: 'Spend your DON!! so the least is left unused.',
};

export default function DrillsHome({ path }: { path: string }) {
  useEffect(() => {
    document.title = 'Drills · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);
  return (
    <main className="page drills" id="main" aria-labelledby="page-title" data-path={path}>
      <h1 id="page-title" tabIndex={-1}>
        Drills
      </h1>
      <p className="lede">
        Four short drills, each tied to a lesson. Nothing is timed unless you switch a timer on.
      </p>
      <ul className="drill-list">
        {DRILL_SLUGS.map((d) => (
          <li key={d} className="drill-tile">
            <h2>
              <Link to={`/drills/${d}`}>{DRILL_NAMES[d]}</Link>
            </h2>
            <p>{ASKS[d]}</p>
            <p className="subtle">
              Lesson: <Link to={`/learn/${DRILL_LESSON[d]}`}>{lessonName(DRILL_LESSON[d])}</Link>.
              Pass: {EXIT[d].needed} of {EXIT[d].of}, untimed.
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
