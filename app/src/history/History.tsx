/**
 * History, the "Reviews" page (M8 WP6; learning-ui §9, flows G8): every saved game, newest first,
 * with its result in words, opponent and tier, deck, date, turns, flags by severity, tags, and
 * Review. A game whose analysis did not finish says "Analysis incomplete · Resume"; one found to
 * be from an older build says "Read-only: older version". Filters: result, opponent, has severe
 * flags; sort by date or severe flags. `?mode=delete` (the storage-full notice's link) is a
 * select-and-delete mode: nothing is ever deleted without the player choosing it and confirming.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearch } from '../router.tsx';
import { download } from '../tutorial/timing.ts';
import { exportGame, gameFileName } from '../store/data.ts';
import { getStore } from '../store/index.ts';
import {
  SAVED_FULL,
  clearStoreFull,
  retryStashed,
  settleStore,
  useStoreStatus,
} from '../store/open.ts';
import {
  NO_FILTERS,
  RESULT_WORD,
  flagsText,
  formatDate,
  incomplete,
  practisedText,
  rowLabel,
  tierWord,
  visibleRows,
  type Filters,
  type Row,
} from './model.ts';
import './history.css';

export function History() {
  const search = useSearch();
  const status = useStoreStatus();
  const uid = useId();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  // `?mode=delete` (the storage-full notice's link) opens the page in delete mode; the player's own
  // toggle after that wins.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const deleting = toggled ?? new URLSearchParams(search).get('mode') === 'delete';
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [said, setSaid] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  const [tick, setTick] = useState(0);
  const load = () => setTick((n) => n + 1);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const out: Row[] = [];
      try {
        await settleStore();
        const store = getStore();
        const games = await store.listGames();
        const staleKeys = new Set((await store.meta.keys()).filter((k) => k.startsWith('stale.')));
        for (const g of games) {
          let review;
          try {
            review = await store.getReview(g.id);
          } catch {
            review = undefined;
          }
          const reason = staleKeys.has(`stale.${g.id}`)
            ? await store.meta.get(`stale.${g.id}`)
            : undefined;
          out.push({
            id: g.id,
            meta: g.meta,
            review,
            stale: typeof reason === 'string' ? reason : undefined,
          });
        }
      } catch {
        out.length = 0;
      }
      if (alive) setRows(out);
    })();
    return () => {
      alive = false;
    };
  }, [tick]);
  useEffect(() => {
    document.title = 'Reviews · OPTCG Sim';
  }, []);

  const shown = useMemo(() => (rows ? visibleRows(rows, filters) : []), [rows, filters]);
  const opponents = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.meta.opponentLeader).filter(Boolean))].sort(),
    [rows],
  );

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (!n.delete(id)) n.add(id);
      return n;
    });

  const remove = async () => {
    const store = getStore();
    const ids = [...picked];
    let failed = 0;
    for (const id of ids) {
      try {
        await store.deleteGame(id);
        await store.meta.delete(`stale.${id}`).catch(() => undefined);
      } catch {
        failed++;
      }
    }
    setPicked(new Set());
    setConfirm(false);
    // Room was made: the game a full store turned away is saved now (and the notice clears with it).
    if (ids.length - failed > 0) {
      clearStoreFull();
      await retryStashed();
    }
    setSaid(
      failed > 0
        ? `Deleted ${ids.length - failed} of ${ids.length}. ${failed} could not be deleted.`
        : `Deleted ${ids.length} ${ids.length === 1 ? 'game' : 'games'}.`,
    );
    load();
    heading.current?.focus();
  };

  const exportOne = async (id: string) => {
    try {
      await settleStore();
      const text = await exportGame(getStore(), id);
      if (text === null) return setSaid('That game is no longer saved.');
      download(gameFileName(id), text, 'application/json');
      setSaid('Exported the game to a file.');
    } catch {
      setSaid('The export failed. Nothing was changed.');
    }
  };

  return (
    <main className="page history" id="main" aria-labelledby={`${uid}-h`}>
      <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
        Reviews
      </h1>
      {(deleting || status.full) && (
        <p className="notice" role="note">
          {status.full || deleting
            ? 'Saved games are full. Delete old reviews to keep saving.'
            : SAVED_FULL}
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite" data-testid="history-status">
        {said}
      </p>
      {rows === null ? (
        <p aria-busy="true">Loading your games…</p>
      ) : rows.length === 0 ? (
        <div className="hist-empty" data-testid="history-empty">
          <p>No games yet: play a game and its review appears here.</p>
          <p>
            <Link className="btn primary" to="/play">
              Play a game
            </Link>{' '}
            <Link className="btn" to="/tutorial">
              Try the tutorial
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="hist-controls">
            <label>
              Result{' '}
              <select
                value={filters.result}
                onChange={(e) =>
                  setFilters({ ...filters, result: e.target.value as Filters['result'] })
                }
              >
                <option value="all">All results</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="draw">Draw</option>
              </select>
            </label>
            <label>
              Opponent{' '}
              <select
                value={filters.opponent}
                onChange={(e) => setFilters({ ...filters, opponent: e.target.value })}
              >
                <option value="all">All opponents</option>
                {opponents.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="hist-check">
              <input
                type="checkbox"
                checked={filters.severe}
                onChange={(e) => setFilters({ ...filters, severe: e.target.checked })}
              />{' '}
              Has severe flags
            </label>
            <label>
              Sort by{' '}
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value as Filters['sort'] })
                }
              >
                <option value="date">Date, newest first</option>
                <option value="severe">Severe flags, most first</option>
              </select>
            </label>
            <button
              type="button"
              className="btn small"
              aria-pressed={deleting}
              onClick={() => {
                setToggled(!deleting);
                setPicked(new Set());
                setConfirm(false);
              }}
            >
              {deleting ? 'Done deleting' : 'Select games to delete'}
            </button>
          </div>
          {deleting && (
            <div className="hist-delete">
              <button
                type="button"
                className="btn small"
                onClick={() => setPicked(new Set(shown.map((r) => r.id)))}
              >
                Select all shown
              </button>
              <button
                type="button"
                className="btn small danger"
                disabled={picked.size === 0}
                onClick={() => setConfirm(true)}
              >
                Delete selected ({picked.size})
              </button>
              {confirm && (
                <span role="alertdialog" aria-label="Confirm delete" className="hist-confirm">
                  Delete {picked.size} {picked.size === 1 ? 'game' : 'games'} and their reviews from
                  this device? This cannot be undone.{' '}
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => void remove()}
                    autoFocus
                  >
                    Delete
                  </button>{' '}
                  <button type="button" className="btn small" onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                </span>
              )}
            </div>
          )}
          {shown.length === 0 ? (
            <p className="subtle">No games match these filters.</p>
          ) : (
            <div className="hist-scroll" role="region" aria-label="Saved games" tabIndex={0}>
              <table className="rv-table hist-table" data-testid="history-table">
                <caption className="sr-only">Saved games, newest first</caption>
                <thead>
                  <tr>
                    {deleting && <th scope="col">Select</th>}
                    <th scope="col">Game</th>
                    <th scope="col">Your deck</th>
                    <th scope="col">Date</th>
                    <th scope="col">Turns</th>
                    <th scope="col">Flags</th>
                    <th scope="col">Notes</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} data-game={r.id}>
                      {deleting && (
                        <td>
                          <input
                            type="checkbox"
                            checked={picked.has(r.id)}
                            aria-label={`Select ${rowLabel(r).replace(/ Review\.$/, '')}`}
                            onChange={() => toggle(r.id)}
                          />
                        </td>
                      )}
                      <th scope="row">
                        {RESULT_WORD[r.meta.result]}
                        {r.meta.result === 'draw'
                          ? ' with '
                          : r.meta.result === 'won'
                            ? ' against '
                            : ' to '}
                        {r.meta.opponentLeader || 'the AI'}
                        <span className="subtle"> · {tierWord(r.meta.tier)}</span>
                      </th>
                      <td>{r.meta.deckName || '—'}</td>
                      <td>{formatDate(r.meta.endedAt)}</td>
                      <td>{r.meta.turns}</td>
                      <td>
                        {flagsText(r)}
                        {practisedText(r) && <span className="subtle"> · {practisedText(r)}</span>}
                      </td>
                      <td>
                        {r.meta.tags.map((t) => (
                          <span key={t} className="chip outline">
                            {t}
                          </span>
                        ))}
                        {r.stale && (
                          <span className="chip outline">
                            {r.stale === 'large'
                              ? 'Read-only: too long to replay'
                              : 'Read-only: older version'}
                          </span>
                        )}
                        {incomplete(r) && !r.stale && (
                          <Link to={`/reviews/${encodeURIComponent(r.id)}`}>
                            Analysis incomplete · Resume
                          </Link>
                        )}
                      </td>
                      <td className="hist-actions">
                        <Link
                          className="btn small primary"
                          to={`/reviews/${encodeURIComponent(r.id)}`}
                          aria-label={rowLabel(r)}
                        >
                          Review
                        </Link>{' '}
                        <button
                          type="button"
                          className="btn small"
                          aria-label={`Export ${rowLabel(r).replace(/ Review\.$/, '')}`}
                          onClick={() => void exportOne(r.id)}
                        >
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
