/**
 * The Life line (learning-ui §4.1): both players' Life at the start of each turn as a small chart,
 * hidden from assistive technology, and the same numbers as a table in a disclosure ("Life by
 * turn"), which is the accessible form. Nothing is only colour: the opponent's line is dashed.
 */
import type { PlayerId } from '@optcg/engine';
import type { TurnInfo } from './model.ts';

const W = 560;
const H = 64;
const PAD = 6;

export function Sparkline({
  turns,
  final,
  me,
  oppName,
}: {
  turns: readonly TurnInfo[];
  /** Life after the last action, or null. */
  final: Record<PlayerId, number> | null;
  me: PlayerId;
  oppName: string;
}) {
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';
  const rows = turns.map((t) => ({
    label: `Turn ${t.turn}`,
    mine: t.life[me],
    theirs: t.life[opp],
  }));
  if (final) rows.push({ label: 'End of the game', mine: final[me], theirs: final[opp] });
  const max = Math.max(1, ...rows.flatMap((r) => [r.mine, r.theirs]));
  const x = (i: number) => PAD + (rows.length <= 1 ? 0 : (i * (W - 2 * PAD)) / (rows.length - 1));
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const line = (pick: (r: (typeof rows)[number]) => number) =>
    rows.map((r, i) => `${x(i).toFixed(1)},${y(pick(r)).toFixed(1)}`).join(' ');

  if (rows.length === 0) return null;
  return (
    <div className="spark">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
        className="spark-svg"
        preserveAspectRatio="none"
      >
        <polyline points={line((r) => r.theirs)} className="spark-them" fill="none" />
        <polyline points={line((r) => r.mine)} className="spark-me" fill="none" />
      </svg>
      <p className="subtle spark-key" aria-hidden="true">
        <span className="spark-swatch me" /> Your Life <span className="spark-swatch them" />{' '}
        {oppName}’s Life, at the start of each turn
      </p>
      <details className="spark-table">
        <summary>Life by turn</summary>
        <table className="rv-table">
          <caption className="sr-only">Life at the start of each turn</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Your Life</th>
              <th scope="col">{oppName}’s Life</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>{r.mine}</td>
                <td>{r.theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
