/**
 * The review timeline (learning-ui §4.1, §4.2): one column per game turn with the mulligan as
 * column 0, and two rows, "You" (flags, "not fully checked" markers, hatching for turns not
 * analysed yet) and "<Leader>'s notable moves". Flag shapes follow the kind and their size the
 * severity (20, 16, 12 px; Hindsight 14 px, dashed), and "Severe" is also said in words.
 *
 * Keyboard (accessibility §3.12): the timeline is one `role="application"` region with a roving
 * tab stop. Left and Right move between turns, Up and Down between the two rows, Home and End to
 * the ends, Enter or Space chooses the cell (on a turn with several flags it steps through them).
 * Every action here is also reachable without the arrows: the Flags list under it is a tab stop of
 * its own (L-SR3).
 */
import { useRef, useState } from 'react';
import type { ReviewFlag, ReviewMarker } from '@optcg/ai';
import type { PlayerId } from '@optcg/engine';
import { KIND_SHAPE, SEVERITY, flagName, type Actors, type Shape, type TurnInfo } from './model.ts';

/** One flag's mark: an inline SVG (never text, so its size is exact), hidden from assistive tech. */
export function FlagShape({
  shape,
  size,
  hindsight = false,
}: {
  shape: Shape;
  size: number;
  hindsight?: boolean;
}) {
  const stroke = 'currentColor';
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    'aria-hidden': true,
    focusable: false,
    className: `flag-shape${hindsight ? ' hindsight' : ''}`,
  } as const;
  const fill = hindsight ? 'none' : stroke;
  const hollow = 'none';
  const dash = hindsight ? '3 2' : undefined;
  const sw = 2;
  switch (shape) {
    case 'diamond':
    case 'diamond-slash':
      return (
        <svg {...common}>
          <path
            d="M10 1.5 18.5 10 10 18.5 1.5 10Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={dash}
          />
          {shape === 'diamond-slash' && (
            <path d="M3 17 17 3" stroke="var(--color-surface-1)" strokeWidth={2.5} />
          )}
        </svg>
      );
    case 'triangle':
    case 'triangle-hollow':
      return (
        <svg {...common}>
          <path
            d="M10 2 18.5 17.5H1.5Z"
            fill={shape === 'triangle' && !hindsight ? stroke : hollow}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={dash}
          />
        </svg>
      );
    case 'square-hollow':
      return (
        <svg {...common}>
          <rect
            x="2.5"
            y="2.5"
            width="15"
            height="15"
            fill={hollow}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={dash}
          />
        </svg>
      );
    case 'circle-hollow':
      return (
        <svg {...common}>
          <circle
            cx="10"
            cy="10"
            r="7.5"
            fill={hollow}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={dash}
          />
        </svg>
      );
    case 'bar':
      return (
        <svg {...common}>
          <rect
            x="3"
            y="7"
            width="14"
            height="6"
            fill={hindsight ? 'none' : stroke}
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={dash}
          />
        </svg>
      );
  }
}

/** The dashed circle of "not fully checked". */
export function MarkerShape({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable={false}
      className="flag-shape marker"
    >
      <circle
        cx="10"
        cy="10"
        r="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="3 2.5"
      />
    </svg>
  );
}

type Row = 'you' | 'opp';
interface Pos {
  col: number;
  row: Row;
}

export interface TimelineProps {
  turns: readonly TurnInfo[];
  actors: Actors;
  /** The reviewed seat's flags (mulligan flags sit in column 0). */
  flags: readonly ReviewFlag[];
  markers: readonly ReviewMarker[];
  /** Notes (not flags) by turn, to say "has a note". */
  notes: ReadonlyMap<number, unknown[]>;
  notable: ReadonlyMap<number, string[]>;
  /** Turns not analysed yet (hatched). */
  pending: ReadonlySet<number>;
  /** The record has no usable turn events (a stale record): the opponent row says so. */
  noOpponentRow: boolean;
  selectedFlag: string | null;
  selectedTurn: number | null;
  onChoose(turn: number, flagId: string | null): void;
  me: PlayerId;
}

const cellName = (
  turn: number,
  a: Actors,
  flags: ReviewFlag[],
  marker: ReviewMarker | undefined,
  pending: boolean,
  hasNote: boolean,
): string => {
  // The name starts with the words the cell shows ("2 flags"), so it contains its visible text
  // (WCAG 2.5.3, axe label-content-name-mismatch).
  if (flags.length > 0)
    return `${flags.length > 1 ? `${flags.length} flags: ` : ''}${flags.map((f) => flagName(f, a)).join(' ')}`;
  const head =
    turn === 0
      ? 'Mulligan'
      : `Turn ${turn}, ${a.playerOf(turn) === a.me ? 'your turn' : `${a.oppName}’s turn`}`;
  if (marker)
    return `${head}: ${marker.reason === 'search-incomplete' ? 'not fully checked' : 'not analysed'}.`;
  if (pending) return `${head}: not analysed yet.`;
  return `${head}: no flag${hasNote ? ', with a note' : ''}.`;
};

export function Timeline(p: TimelineProps) {
  const { turns, actors } = p;
  const cols = [0, ...turns.map((t) => t.turn)];
  const [pos, setPos] = useState<Pos>({ col: 0, row: 'you' });
  const root = useRef<HTMLOListElement>(null);
  const flagsAt = (turn: number) =>
    p.flags.filter((f) =>
      turn === 0 ? f.kind === 'mulligan' : f.kind !== 'mulligan' && f.turn === turn,
    );
  const markerAt = (turn: number) => p.markers.find((m) => m.turn === turn);
  const focus = (col: number, row: Row) => {
    setPos({ col, row });
    root.current?.querySelector<HTMLElement>(`[data-cell="${col}-${row}"]`)?.focus();
  };
  const cells = (row: Row) => cols.filter((c) => row === 'you' || c !== 0);

  const key = (e: React.KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (!el) return;
    const [c, row] = el.dataset.cell!.split('-') as [string, Row];
    const here = Number(c);
    const list = cells(row);
    const i = list.indexOf(here);
    let next: Pos | null = null;
    if (e.key === 'ArrowRight') next = { col: list[Math.min(list.length - 1, i + 1)]!, row };
    else if (e.key === 'ArrowLeft') next = { col: list[Math.max(0, i - 1)]!, row };
    else if (e.key === 'Home') next = { col: list[0]!, row };
    else if (e.key === 'End') next = { col: list.at(-1)!, row };
    else if (e.key === 'ArrowDown' && row === 'you')
      next = { col: here === 0 ? (cols[1] ?? 0) : here, row: 'opp' };
    else if (e.key === 'ArrowUp' && row === 'opp') next = { col: here, row: 'you' };
    if (!next) return;
    e.preventDefault();
    e.stopPropagation();
    focus(next.col, next.row);
  };

  const choose = (turn: number) => {
    const fs = flagsAt(turn);
    if (fs.length === 0) return p.onChoose(turn, null);
    // On a turn with several flags the next press steps to the next one.
    const at = fs.findIndex((f) => f.id === p.selectedFlag);
    p.onChoose(turn, fs[(at + 1) % fs.length]!.id);
  };

  return (
    <div
      role="application"
      aria-roledescription="turn timeline"
      aria-label="Turn timeline. Left and Right arrows move between turns, Up and Down between your row and the opponent's, N between flags."
    >
      <ol
        className="rv-tl"
        ref={root}
        aria-label="Turns, left to right"
        onKeyDown={key}
        style={{ ['--n' as string]: cols.length }}
      >
        <li className="rv-tl-axis" aria-hidden="true">
          <span className="rv-tl-head" />
          <span className="rv-tl-rowname">You</span>
          <span className="rv-tl-rowname">{actors.oppName}’s notable moves</span>
        </li>
        {cols.map((turn) => {
          const info = turns.find((t) => t.turn === turn);
          const mine = turn === 0 || info?.player === p.me;
          const fs = flagsAt(turn);
          const marker = markerAt(turn);
          const pending = turn !== 0 && mine && p.pending.has(turn);
          const unrun = !!marker && marker.reason !== 'search-incomplete';
          const note = p.notes.get(turn)?.length ? true : false;
          const top = fs.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank)[0];
          const moves = p.notable.get(turn) ?? [];
          const selected = p.selectedTurn === turn;
          return (
            <li
              key={turn}
              className={`rv-tl-col ${turn === 0 ? 'zero' : mine ? 'mine' : 'theirs'}`}
            >
              <span className="rv-tl-turn">
                {turn === 0 ? 'Mulligan' : `T${turn} · ${mine ? 'You' : 'Opp'}`}
              </span>
              <button
                type="button"
                className={`rv-tl-cell you ${top ? `sev-${top.severity}` : ''} ${marker ? 'sev-marker' : ''} ${pending || unrun ? 'hatched' : ''}`}
                data-cell={`${turn}-you`}
                data-turn={turn}
                tabIndex={pos.col === turn && pos.row === 'you' ? 0 : -1}
                aria-current={selected ? 'true' : undefined}
                aria-label={cellName(turn, actors, fs, marker, pending, note)}
                onClick={() => {
                  setPos({ col: turn, row: 'you' });
                  choose(turn);
                }}
                onFocus={() => setPos({ col: turn, row: 'you' })}
              >
                <span className="rv-tl-marks" aria-hidden="true">
                  {fs.map((f) => (
                    <span
                      key={f.id}
                      className={`rv-tl-mark ${f.id === p.selectedFlag ? 'on' : ''}`}
                    >
                      <FlagShape
                        shape={KIND_SHAPE[f.kind]}
                        size={SEVERITY[f.severity].size}
                        hindsight={f.severity === 'hindsight'}
                      />
                    </span>
                  ))}
                  {marker && <MarkerShape />}
                </span>
                {top && (top.severity === 'severe' || top.severity === 'hindsight') && (
                  <span className={`rv-tl-word sev-${top.severity}`} aria-hidden="true">
                    {SEVERITY[top.severity].word}
                  </span>
                )}
                {marker && !top && (
                  <span className="rv-tl-word sev-marker" aria-hidden="true">
                    {marker.reason === 'search-incomplete' ? 'Not fully checked' : 'Not analysed'}
                  </span>
                )}
                {pending && !marker && (
                  <span className="rv-tl-word sev-pending" aria-hidden="true">
                    Not analysed yet
                  </span>
                )}
                {fs.length > 1 && (
                  <span className="rv-tl-word" aria-hidden="true">
                    {fs.length} flags
                  </span>
                )}
              </button>
              {turn === 0 ? (
                <span className="rv-tl-cell opp blank" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  className="rv-tl-cell opp"
                  data-cell={`${turn}-opp`}
                  data-turn={turn}
                  tabIndex={pos.col === turn && pos.row === 'opp' ? 0 : -1}
                  aria-label={`Turn ${turn}, ${actors.oppName}’s notable moves: ${
                    p.noOpponentRow
                      ? 'not available for a game from an older version.'
                      : moves.length
                        ? moves.join('; ') + '.'
                        : 'none.'
                  }`}
                  onClick={() => {
                    setPos({ col: turn, row: 'opp' });
                    p.onChoose(turn, null);
                  }}
                  onFocus={() => setPos({ col: turn, row: 'opp' })}
                >
                  <span className="rv-tl-moves" aria-hidden="true">
                    {moves.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const LEGEND = [
  { shape: 'diamond' as Shape, text: 'Missed lethal' },
  { shape: 'diamond-slash' as Shape, text: 'Lethal given away' },
  { shape: 'triangle' as Shape, text: 'Hit that should have been countered' },
  { shape: 'triangle-hollow' as Shape, text: 'Counter wasted' },
  { shape: 'square-hollow' as Shape, text: 'DON!! left unused' },
  { shape: 'circle-hollow' as Shape, text: 'Poor attack ordering' },
  { shape: 'bar' as Shape, text: 'Mulligan' },
];
