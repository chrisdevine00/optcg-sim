/**
 * `/meta/matchups` (M9 WP1, learning-ui §5.3): the 12 by 12 grid of plans, rows "you play", columns
 * "against". A cell shows the row deck's sourced W–L where a guide gives one, else "plan"; never a
 * percentage, never a colour scale (most cells are our reasoning). Arrows move cell by cell, Enter
 * opens the details, Esc closes them and returns focus to the cell.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from '../router.tsx';
import { loadGuides } from './guides.ts';
import {
  cellLabel,
  cellMarker,
  displayName,
  matchupGrid,
  matchupHref,
  recordOwner,
  shortName,
  tiles,
} from './model.ts';
import { Spans } from './GuideRoute.tsx';
import type { Cell, Guide, GuideMatchup } from './types.ts';
import './meta.css';

const LEADERS = tiles().map((t) => t.leaderId);

function Side({ who, m }: { who: string; m: GuideMatchup }) {
  return (
    <li>
      <b>{shortName(who)}’s guide</b> ({m.record ? recordOwner(m) : 'no record'}):{' '}
      {m.record ? <Spans spans={m.recordSpans} /> : 'no record found'}
    </li>
  );
}

function Details({ cell, onClose }: { cell: Cell; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: 'nearest' });
  }, [cell]);
  const title = `${shortName(cell.row)} against ${shortName(cell.col)}`;
  const e = cell.entry;
  return (
    <div
      className="meta-pop"
      role="dialog"
      aria-modal="false"
      aria-labelledby="pop-title"
      tabIndex={-1}
      ref={ref}
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') {
          ev.stopPropagation();
          onClose();
        }
      }}
    >
      <h2 id="pop-title">{title}</h2>
      {cell.mirror && <p>The same deck on both sides. There is no matchup plan for a mirror.</p>}
      {!cell.mirror && !e && <p>No plan is written for this pairing.</p>}
      {e && (
        <>
          {cell.disagree && e && cell.other ? (
            <>
              <p>
                <b>Sources disagree</b> about this pairing. Each guide’s record is its own deck’s
                wins and losses:
              </p>
              <ul>
                <Side who={cell.row} m={e} />
                <Side who={cell.col} m={cell.other} />
              </ul>
            </>
          ) : e.record ? (
            <p>
              <b>Record</b> ({recordOwner(e)}): <Spans spans={e.recordSpans} />
            </p>
          ) : (
            <p className="subtle">No record found for this pairing.</p>
          )}
          <p>
            <b>Plan:</b> <Spans spans={e.plan} />
            {!e.inference && e.tags.length === 0 && (
              <span className="subtle"> (no source given)</span>
            )}
          </p>
        </>
      )}
      <div className="meta-actions">
        <Link className="btn primary" to={matchupHref(cell.row, cell.col)}>
          Play this matchup
        </Link>
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export default function MatchupGrid({ path }: { path: string }) {
  const [guides, setGuides] = useState<Guide[] | null>(null);
  const [at, setAt] = useState({ r: 0, c: 0 });
  const [open, setOpen] = useState<Cell | null>(null);
  const table = useRef<HTMLTableElement>(null);

  useEffect(() => {
    let live = true;
    void loadGuides().then((g) => live && setGuides(g));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    document.title = 'Matchup grid · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);

  const grid = useMemo(() => (guides ? matchupGrid(guides) : null), [guides]);

  const focusCell = (r: number, c: number) => {
    setAt({ r, c });
    table.current?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${c}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (!KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    const m = /^(\d+)-(\d+)$/.exec((e.target as HTMLElement).dataset.cell ?? '');
    if (!m) return;
    e.preventDefault();
    const n = LEADERS.length - 1;
    let r = Number(m[1]);
    let c = Number(m[2]);
    if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (e.key === 'ArrowRight') c = Math.min(n, c + 1);
    else if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
    else if (e.key === 'ArrowDown') r = Math.min(n, r + 1);
    else if (e.key === 'Home') c = 0;
    else c = n;
    focusCell(r, c);
  };

  const close = () => {
    const o = open;
    setOpen(null);
    if (o) {
      const r = LEADERS.indexOf(o.row);
      const c = LEADERS.indexOf(o.col);
      // After the panel has gone, so focus lands on a cell that still exists.
      requestAnimationFrame(() => focusCell(r, c));
    }
  };

  return (
    <main className="page meta" id="main" aria-labelledby="page-title" data-path={path}>
      <p className="subtle">
        <Link to="/meta">← Meta Explorer</Link>
      </p>
      <h1 id="page-title" tabIndex={-1}>
        Matchup grid
      </h1>
      <p className="lede">
        Rows are the deck you play, columns the deck you face. A number is the row deck’s wins and
        losses from the guide’s source; “plan” means the guide has a plan but no record.{' '}
        <span aria-hidden="true">≠</span>
        <span className="sr-only">Sources disagree</span> marks a pairing two guides record
        differently. Arrow keys move between cells, Enter opens the details.
      </p>
      {!grid ? (
        <p role="status">Loading the grid…</p>
      ) : (
        <div
          className="meta-scroll meta-grid-frame"
          role="region"
          aria-label="Matchup grid"
          tabIndex={0}
        >
          <table className="meta-grid" ref={table} onKeyDown={onKeyDown}>
            <caption className="sr-only">
              Matchup plans: the deck you play down the side, the deck you face across the top
            </caption>
            <thead>
              <tr>
                <th scope="col" className="meta-corner">
                  <span className="sr-only">You play, against</span>
                  <span aria-hidden="true">You play ↓ · against →</span>
                </th>
                {LEADERS.map((l) => (
                  <th key={l} scope="col">
                    {shortName(l)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, r) => (
                <tr key={LEADERS[r]}>
                  <th scope="row" title={displayName(LEADERS[r]!)}>
                    {shortName(LEADERS[r]!)}
                  </th>
                  {row.map((cell, c) => (
                    <td key={cell.col} className={cell.mirror ? 'meta-mirror' : undefined}>
                      <button
                        type="button"
                        className={`meta-cell${cell.entry?.record ? ' has-record' : ' plan-only'}`}
                        data-cell={`${r}-${c}`}
                        tabIndex={r === at.r && c === at.c ? 0 : -1}
                        aria-label={cellLabel(cell)}
                        aria-haspopup="dialog"
                        onFocus={() => setAt({ r, c })}
                        onClick={() => setOpen(cell)}
                      >
                        {cellMarker(cell)}
                      </button>
                      {cell.disagree && (
                        <span className="meta-neq" aria-hidden="true">
                          ≠
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <Details cell={open} onClose={close} />}
    </main>
  );
}
