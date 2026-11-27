/**
 * The Progress page's small charts (M9 WP6; learning-ui §6.2): a drill's accuracy over sessions as a
 * line, hidden from assistive technology, with the same numbers as a table in a disclosure, which is the
 * accessible form (the pattern of the review's Life line). Untimed sessions are a solid line with round
 * marks, timed ones a dashed line with square marks, so nothing is colour alone; the pass line is a
 * dotted rule and is also stated in words.
 */
import type { AccuracyPoint } from './derive.ts';

const W = 560;
const H = 96;
const PAD = 8;

export const factorWords = (f: number | null): string =>
  f === null ? 'Untimed' : `Timed at ${Math.round(f * 100)}%`;

export function AccuracyChart({
  id,
  name,
  untimed,
  timed,
  passPercent,
}: {
  id: string;
  name: string;
  untimed: readonly AccuracyPoint[];
  timed: readonly AccuracyPoint[];
  /** The exit's share, 0 to 100, drawn as a rule; null for none. */
  passPercent: number | null;
}) {
  const all = [...untimed, ...timed].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  if (all.length === 0) return <p className="subtle">No {name} sessions yet.</p>;
  const idx = new Map(all.map((p, i) => [p, i]));
  const x = (p: AccuracyPoint) =>
    PAD + (all.length <= 1 ? (W - 2 * PAD) / 2 : (idx.get(p)! * (W - 2 * PAD)) / (all.length - 1));
  const y = (pct: number) => H - PAD - (pct / 100) * (H - 2 * PAD);
  const line = (pts: readonly AccuracyPoint[]) =>
    pts.map((p) => `${x(p).toFixed(1)},${y(p.percent).toFixed(1)}`).join(' ');
  return (
    <div className="pg-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
        className="pg-chart-svg"
        preserveAspectRatio="none"
      >
        {passPercent !== null && (
          <line x1={PAD} x2={W - PAD} y1={y(passPercent)} y2={y(passPercent)} className="pg-pass" />
        )}
        {untimed.length > 1 && (
          <polyline points={line(untimed)} className="pg-untimed" fill="none" />
        )}
        {timed.length > 1 && <polyline points={line(timed)} className="pg-timed" fill="none" />}
        {untimed.map((p) => (
          <circle key={`u${p.at}`} cx={x(p)} cy={y(p.percent)} r="3.5" className="pg-dot" />
        ))}
        {timed.map((p) => (
          <rect
            key={`t${p.at}`}
            x={x(p) - 3.5}
            y={y(p.percent) - 3.5}
            width="7"
            height="7"
            className="pg-dot pg-square"
          />
        ))}
      </svg>
      <p className="subtle pg-key" aria-hidden="true">
        <span className="pg-swatch" /> Untimed <span className="pg-swatch dashed" /> Timed{' '}
        {passPercent !== null && (
          <>
            <span className="pg-swatch dotted" /> Pass line {Math.round(passPercent)}%
          </>
        )}
      </p>
      <details className="pg-table">
        <summary>{name} sessions as a table</summary>
        <table className="pg-grid" id={id}>
          <caption className="sr-only">{name}: each session’s result, oldest first</caption>
          <thead>
            <tr>
              <th scope="col">Session</th>
              <th scope="col">Mode</th>
              <th scope="col">Result</th>
              <th scope="col">Share right</th>
            </tr>
          </thead>
          <tbody>
            {all.map((p, i) => (
              <tr key={`${p.at}-${i}`}>
                <th scope="row">{p.at.slice(0, 10)}</th>
                <td>{factorWords(p.factor)}</td>
                <td>
                  {p.correct} of {p.n}
                </td>
                <td>{p.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** A flag kind's bar: a width and its count in text. */
export function CountBar({ label, n, max }: { label: string; n: number; max: number }) {
  return (
    <li className="pg-bar-row">
      <span className="pg-bar-label">{label}</span>
      <span className="pg-bar" aria-hidden="true">
        <span className="pg-bar-fill" style={{ width: `${max === 0 ? 0 : (n / max) * 100}%` }} />
      </span>
      <span className="pg-bar-n">{n}</span>
    </li>
  );
}
