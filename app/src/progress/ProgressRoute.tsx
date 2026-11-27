/**
 * `/progress` (M9 WP6; learning-ui §6): one recommendation card ("Work on"), the course with its
 * status, accuracy per drill, win rates from games that count, flag frequency, the lethal coach log,
 * and the data buttons. Everything is derived at read time from the browser's own stores (`derive.ts`,
 * `recommend.ts`); nothing is sent anywhere.
 */
import type { FlagKind } from '@optcg/ai';
import { useEffect, useMemo, useState } from 'react';
import { DRILL_LESSON, DRILL_NAMES, DRILL_SLUGS } from '../drills/types.ts';
import { drillWords } from '../learn/LearnRoute.tsx';
import { LESSONS } from '../learn/lessons.ts';
import { StatusChip } from '../learn/StatusChip.tsx';
import { Link } from '../router.tsx';
import { download } from '../tutorial/timing.ts';
import { getStore } from '../store/index.ts';
import { settleStore } from '../store/open.ts';
import { AccuracyChart, CountBar } from './Charts.tsx';
import {
  accuracySeries,
  flagFrequency,
  isDone,
  lessonInfo,
  lethalFoundAlone,
  ratePercent,
  winRates,
  type RateRow,
} from './derive.ts';
import { codeOf, isDrillRule, ruleWords } from './exit.ts';
import { recommend } from './recommend.ts';
import { exportProgressOnly } from './store.ts';
import { useProgressData } from './useProgressData.ts';
import './progress.css';

/** The review's names for flag kinds (`KIND_WORD` in play/review/model.ts; a test keeps them equal). */
export const FLAG_WORD: Record<FlagKind, string> = {
  'missed-lethal': 'Missed lethal',
  'given-away': 'Lethal given away',
  'don-unused': 'DON!! left unused',
  'counter-wasted': 'Counter wasted',
  'should-counter': 'Hit that should have been countered',
  target: 'Poor attack ordering',
  mulligan: 'Mulligan',
};

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;
const rateWords = (r: RateRow) =>
  `${r.wins} of ${plural(r.games, 'game')} won (${ratePercent(r)}%)`;

function RateTable({ caption, first, rows }: { caption: string; first: string; rows: RateRow[] }) {
  return (
    <table className="pg-grid">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{first}</th>
          <th scope="col">Games</th>
          <th scope="col">Won</th>
          <th scope="col">Lost</th>
          <th scope="col">Drawn</th>
          <th scope="col">Win rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <th scope="row">{r.label}</th>
            <td>{r.games}</td>
            <td>{r.wins}</td>
            <td>{r.losses}</td>
            <td>{r.draws}</td>
            <td>
              {ratePercent(r)}%<span className="sr-only">: {rateWords(r)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProgressRoute({ path }: { path: string }) {
  const data = useProgressData();
  const [today] = useState(() => Date.now());
  const [said, setSaid] = useState('');
  useEffect(() => {
    document.title = 'Progress · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);

  const input = data.input;
  const rec = useMemo(
    () => recommend({ ...input, lethal: data.lethal }, today),
    [input, data.lethal, today],
  );
  const rates = useMemo(() => winRates(input), [input]);
  const flags = useMemo(() => flagFrequency(input, 20), [input]);
  const lethal = useMemo(() => lethalFoundAlone(data.lethal), [data.lethal]);
  const infos = useMemo(() => LESSONS.map((l) => lessonInfo(l.code, input)), [input]);
  const done = infos.filter((i) => isDone(i.status)).length;

  const exportProgress = async () => {
    try {
      await settleStore();
      const text = await exportProgressOnly(getStore());
      download(
        `optcg-sim-progress-${new Date().toISOString().slice(0, 10)}.json`,
        text,
        'application/json',
      );
      setSaid('Exported your progress to a file. It holds no games.');
    } catch {
      setSaid('The export failed. Nothing was changed.');
    }
  };

  const kinds = Object.entries(flags.byKind) as [FlagKind, number][];
  kinds.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const maxKind = Math.max(0, ...kinds.map(([, n]) => n));

  return (
    <main
      className="page progress"
      id="main"
      aria-labelledby="page-title"
      data-path={path}
      aria-busy={!data.ready || undefined}
    >
      <h1 id="page-title" tabIndex={-1}>
        Progress
      </h1>
      <p className="subtle">
        Kept in this browser only, and included when you export. Games and flags are read from your
        saved games, never copied.
      </p>
      <p className="sr-only" role="status">
        {said}
      </p>

      {!data.ready ? (
        <p role="status">Loading your progress…</p>
      ) : (
        <>
          <section className="pg-card" aria-labelledby="pg-work">
            <h2 id="pg-work">{rec.kind === 'done' ? rec.title : `Work on: ${rec.title}`}</h2>
            <p>{rec.reason}</p>
            {rec.supporting.map((s) => (
              <p className="subtle" key={s}>
                {s}
              </p>
            ))}
            {rec.lesson && rec.lessonId && (
              <p>
                <Link className="btn primary" to={`/learn/${rec.lessonId}`}>
                  Start lesson {rec.lesson}
                </Link>
              </p>
            )}
            {rec.others.length > 0 && (
              <details className="pg-others">
                <summary>Other suggestions</summary>
                <ul>
                  {rec.others.map((o) => (
                    <li key={o.lesson}>
                      <Link to={`/learn/${o.lessonId}`}>
                        {o.lesson} {o.title}
                      </Link>
                      : {o.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section aria-labelledby="pg-course">
            <h2 id="pg-course">Course</h2>
            <p>
              {done} of {LESSONS.length} lessons passed or read. <Link to="/learn">Open Learn</Link>
            </p>
            <table className="pg-grid">
              <caption className="sr-only">Lessons in teaching order, with their status</caption>
              <thead>
                <tr>
                  <th scope="col">Lesson</th>
                  <th scope="col">Status</th>
                  <th scope="col">Practice</th>
                </tr>
              </thead>
              <tbody>
                {LESSONS.map((l, i) => (
                  <tr key={l.id}>
                    <th scope="row">
                      <Link to={`/learn/${l.id}`}>
                        {l.code} {l.title}
                      </Link>
                    </th>
                    <td>
                      <StatusChip status={infos[i]!.status} />
                    </td>
                    <td>{drillWords(infos[i]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="pg-drills">
            <h2 id="pg-drills">Drills</h2>
            {DRILL_SLUGS.map((d) => {
              const rule = lessonInfo(codeOf(DRILL_LESSON[d]), input).rule;
              const series = accuracySeries(input.progress, d);
              return (
                <div className="pg-drill" key={d}>
                  <h3>
                    <Link to={`/drills/${d}`}>{DRILL_NAMES[d]}</Link>
                  </h3>
                  <p className="subtle">
                    {isDrillRule(rule)
                      ? `To pass ${codeOf(DRILL_LESSON[d])}: ${ruleWords(rule)}, untimed.`
                      : ''}
                  </p>
                  <AccuracyChart
                    id={`pg-table-${d}`}
                    name={DRILL_NAMES[d]}
                    untimed={series.untimed}
                    timed={series.timed}
                    passPercent={isDrillRule(rule) ? (rule.n / rule.of) * 100 : null}
                  />
                </div>
              );
            })}
          </section>

          <section aria-labelledby="pg-games">
            <h2 id="pg-games">Games</h2>
            {rates.counted === 0 ? (
              <p>No counted games yet. Finished games appear here, with their win rate.</p>
            ) : (
              <>
                <h3>By your deck</h3>
                <RateTable caption="Win rate by your deck" first="Deck" rows={rates.byArchetype} />
                <h3>By AI tier</h3>
                <RateTable caption="Win rate by AI tier" first="Tier" rows={rates.byTier} />
              </>
            )}
            {rates.excludedNote && <p className="subtle">{rates.excludedNote}.</p>}
          </section>

          <section aria-labelledby="pg-flags">
            <h2 id="pg-flags">Flags</h2>
            {flags.games === 0 ? (
              <p>
                No reviewed games yet. Review a game from Reviews and its flags are counted here.
              </p>
            ) : (
              <>
                <p>
                  {plural(flags.total, 'flag')} in your last {plural(flags.games, 'reviewed game')}.
                </p>
                {kinds.length > 0 && (
                  <ul className="pg-bars" aria-label="Flags by kind">
                    {kinds.map(([k, n]) => (
                      <CountBar key={k} label={FLAG_WORD[k]} n={n} max={maxKind} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="pg-lethal">
            <h2 id="pg-lethal">Lethal</h2>
            {lethal.total === 0 ? (
              <p>
                You have not asked the lethal coach about a chance yet. The detector is under the
                coach panel in a game.
              </p>
            ) : (
              <>
                <p>
                  You asked the lethal coach about {plural(lethal.total, 'chance')}. The furthest
                  you needed:
                </p>
                <ul>
                  <li>Only tier 1 (is there lethal): {lethal.needed.tier1}</li>
                  <li>Tier 2 (hits and attackers): {lethal.needed.tier2}</li>
                  <li>The guided count: {lethal.needed.count}</li>
                  <li>The full line: {lethal.needed.tier3}</li>
                </ul>
              </>
            )}
            <p className="subtle">Lethals found with no help are not recorded yet.</p>
          </section>

          <section aria-labelledby="pg-data">
            <h2 id="pg-data">Your data</h2>
            <p>
              <button type="button" className="btn" onClick={() => void exportProgress()}>
                Export progress only
              </button>{' '}
              <Link className="btn" to="/settings">
                Settings → Data
              </Link>
            </p>
            <p className="subtle">
              Export everything, import a file or delete it all in Settings → Data. An import adds
              to what is here and never removes it.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
