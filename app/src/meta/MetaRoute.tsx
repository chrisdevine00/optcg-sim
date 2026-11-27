/**
 * `/meta` (M9 WP1, learning-ui §5.1): the twelve archetypes as tiles, with where the numbers come
 * from. The tiles are links in a list; arrows move across them, Enter opens a guide, M opens the
 * matchup grid. Dates, shares and tiers are read from `meta-lists.json`; "today" is read once here and
 * handed to the pure staleness check.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Card } from '@optcg/cards';
import { useArt } from '../art/index.ts';
import { DECKS, loadCards } from '../play/setup/decks.ts';
import { Link, navigate } from '../router.tsx';
import {
  automationLine,
  colorsOf,
  colorWords,
  countingMethod,
  filterByColor,
  gridMove,
  header,
  SORT_LABELS,
  sortTiles,
  tileLabel,
  tileLists,
  tiles,
  type MoveKey,
  type SortKey,
} from './model.ts';
import { staleness } from './stale.ts';
import './meta.css';

const ALL = tiles();

function LeaderArt({ card }: { card: Card | undefined }) {
  const art = useArt(card?.artworks[0]);
  return (
    <span className="meta-tile-art" aria-hidden="true">
      {art.src && (
        <img src={art.src} alt="" loading="lazy" onLoad={art.onLoad} onError={art.onError} />
      )}
    </span>
  );
}

const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export default function MetaRoute({ path }: { path: string }) {
  const [sort, setSort] = useState<SortKey>('share');
  const [color, setColor] = useState<string | null>(null);
  const [cards, setCards] = useState<ReadonlyMap<string, Card> | null>(null);
  const [today] = useState(() => new Date());
  const [cur, setCur] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  // Leader art and the automation count need the cards of each deck's first list.
  useEffect(() => {
    let live = true;
    const ids = new Set(ALL.map((t) => t.leaderId));
    for (const d of DECKS) if (d.id.endsWith('#1')) for (const c of d.spec.main) ids.add(c);
    void loadCards(ids).then((loaded) => live && setCards(loaded));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    document.title = 'Meta Explorer · OPTCG Sim';
    document.getElementById('page-title')?.focus();
  }, []);

  const all = useMemo(() => (cards ? tiles(cards) : ALL), [cards]);
  const shown = useMemo(() => sortTiles(filterByColor(all, color), sort), [all, color, sort]);
  const current = Math.min(cur, Math.max(0, shown.length - 1));

  // M opens the matchup grid, unless the player is typing or choosing in a control.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      navigate('/meta/matchups');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!MOVE_KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    const links = [
      ...(list.current?.querySelectorAll<HTMLAnchorElement>('a.meta-tile-link') ?? []),
    ];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    e.preventDefault();
    const pos = links.map((a) => {
      const r = a.closest('li')!.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top) };
    });
    const to = gridMove(pos, at, e.key as MoveKey);
    setCur(to);
    links[to]?.focus();
  };

  const colors = colorsOf(all);
  return (
    <main className="page meta" id="main" aria-labelledby="page-title" data-path={path}>
      <h1 id="page-title" tabIndex={-1}>
        Meta Explorer
      </h1>
      <p className="lede">{header()}</p>
      <details className="meta-how">
        <summary>How this is counted</summary>
        <p>{countingMethod()}</p>
      </details>
      <div className="meta-controls">
        <div>
          <label htmlFor="meta-sort">Sort by</label>
          <select
            id="meta-sort"
            className="input"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setCur(0);
            }}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="meta-color">Colour</label>
          <select
            id="meta-color"
            className="input"
            value={color ?? ''}
            onChange={(e) => {
              setColor(e.target.value || null);
              setCur(0);
            }}
          >
            <option value="">All colours</option>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Link className="btn" to="/meta/matchups" aria-keyshortcuts="M">
          Matchup grid <kbd>M</kbd>
        </Link>
      </div>
      <p role="status" className="subtle">
        {shown.length} {shown.length === 1 ? 'deck' : 'decks'}, sorted by{' '}
        {SORT_LABELS[sort].toLowerCase()}
        {color ? `, ${color} only` : ''}. Arrow keys move between decks, Enter opens a guide.
      </p>
      <ul className="meta-tiles" ref={list} onKeyDown={onKeyDown} aria-label="Archetypes">
        {shown.map((t, i) => {
          const st = staleness(tileLists(t), today);
          const first = cards?.get(t.leaderId);
          return (
            <li key={t.archetypeId} className="meta-tile">
              <LeaderArt card={first} />
              <div className="meta-tile-body">
                <h2 className="meta-tile-name">
                  <Link
                    className="meta-tile-link"
                    to={`/meta/${t.leaderId}`}
                    tabIndex={i === current ? 0 : -1}
                    aria-label={tileLabel(t)}
                    onFocus={() => setCur(i)}
                  >
                    {t.name}
                  </Link>
                </h2>
                <p className="meta-tile-facts" aria-hidden="true">
                  <span className="num">{t.leaderId}</span> · {colorWords(t.colors)}
                  <br />
                  {t.tier ? (
                    <span title={t.tierSource ?? undefined}>Tier {t.tier} (opmetagame)</span>
                  ) : (
                    <span>No tier</span>
                  )}
                  <br />
                  <span className="num">{t.metaShare}%</span> of lists
                  {t.metaSharePostBan !== null && (
                    <>
                      , <span className="num">{t.metaSharePostBan}%</span> since the ban
                    </>
                  )}
                </p>
                <p className="meta-tile-more">
                  <span className={st.stale ? 'meta-stale' : undefined}>
                    {st.stale ? '⚠ ' : ''}
                    {st.label}
                  </span>
                  <br />
                  {cards ? (
                    automationLine(t)
                  ) : (
                    <span className="subtle">Checking card automation…</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
