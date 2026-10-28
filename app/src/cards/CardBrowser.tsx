import { useEffect, useMemo, useRef, useState } from 'react';
import { COLORS, CATEGORIES, KEYWORDS, type Card, type SetFile } from '@optcg/cards';
import { loadSet, manifest } from '@optcg/cards/browser';
import { Inspector } from './Inspector.tsx';
import { ResultsGrid } from './ResultsGrid.tsx';
import {
  allTypes,
  emptyFilters,
  filterCards,
  setFromQuery,
  type CostFilter,
  type Filters,
  type SortKey,
} from './filters.ts';

const setIndex = new Map(manifest.sets.map((s, i) => [s.code, i]));
const setOrder = (code: string) => setIndex.get(code) ?? 999;
const COSTS: CostFilter[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
const KIND_LABEL = {
  booster: 'Boosters',
  extra: 'Extra boosters',
  premium: 'Premium boosters',
  starter: 'Starter decks',
  promo: 'Promotions',
};

/** The first real screen (M1): every English card, searchable and filterable, with an inspector. */
export default function CardBrowser() {
  const [filters, setFilters] = useState<Filters>(() => emptyFilters(manifest.newestSet));
  const [loaded, setLoaded] = useState<Map<string, SetFile>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Card | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const search = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setActive(0);
  };

  // Load card JSON per set, on demand: the chosen set, every set for "All sets", or the set a card number names.
  const idSet = setFromQuery(filters.query);
  const wanted = useMemo(() => {
    if (filters.set === 'all') return manifest.sets.map((s) => s.code);
    return [...new Set([filters.set, ...(idSet && setIndex.has(idSet) ? [idSet] : [])])];
  }, [filters.set, idSet]);
  useEffect(() => {
    let live = true;
    for (const code of wanted) {
      if (loaded.has(code)) continue;
      loadSet(code).then(
        (s) => live && setLoaded((m) => (m.has(code) ? m : new Map(m).set(code, s))),
        (e: unknown) => live && setError(`Could not load ${code}: ${String(e)}`),
      );
    }
    return () => {
      live = false;
    };
  }, [wanted, loaded]);

  const pending = wanted.filter((c) => !loaded.has(c)).length;
  const pool = useMemo(() => wanted.flatMap((c) => loaded.get(c)?.cards ?? []), [wanted, loaded]);
  // A card-number query searches the set it names even when another set is selected.
  const effective = useMemo(
    () =>
      idSet && filters.set !== 'all' && idSet !== filters.set
        ? { ...filters, set: idSet }
        : filters,
    [filters, idSet],
  );
  const results = useMemo(() => filterCards(pool, effective, setOrder), [pool, effective]);
  const types = useMemo(() => allTypes(pool), [pool]);

  // "/" focuses search (accessibility.md shortcut sheet).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(t.tagName) && !open) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const activeFilters =
    filters.colors.length +
    filters.categories.length +
    (filters.cost ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.keyword ? 1 : 0) +
    (filters.legality ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0);
  const scope = effective.set === 'all' ? 'all sets' : effective.set;

  return (
    <main className="browser" id="main" aria-labelledby="browser-title">
      <aside className="filters" aria-label="Filters">
        <h1 id="browser-title" className="browser-title">
          Cards
        </h1>
        <div className="field">
          <label htmlFor="f-search">Search name, ID or text</label>
          <input
            ref={search}
            id="f-search"
            className="input"
            type="search"
            placeholder="e.g. Rocks, OP17-039, Blocker"
            value={filters.query}
            aria-keyshortcuts="/"
            onChange={(e) => patch({ query: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="f-set">Set</label>
          <select
            id="f-set"
            className="input"
            value={filters.set}
            onChange={(e) => patch({ set: e.target.value })}
          >
            <option value="all">All sets ({manifest.cardCount})</option>
            {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((kind) => (
              <optgroup key={kind} label={KIND_LABEL[kind]}>
                {manifest.sets
                  .filter((s) => s.kind === kind)
                  .map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} · {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <fieldset className="field">
          <legend>Colour</legend>
          <div className="toggles">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`opt opt-${c.toLowerCase()}`}
                aria-pressed={filters.colors.includes(c)}
                onClick={() => patch({ colors: toggle(filters.colors, c) })}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Category</legend>
          <div className="toggles">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className="opt"
                aria-pressed={filters.categories.includes(c)}
                onClick={() => patch({ categories: toggle(filters.categories, c) })}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-cost">Cost</label>
            <select
              id="f-cost"
              className="input"
              value={filters.cost}
              onChange={(e) => patch({ cost: e.target.value as CostFilter })}
            >
              <option value="">Any</option>
              {COSTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-sort">Sort</label>
            <select
              id="f-sort"
              className="input"
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value as SortKey })}
            >
              <option value="id">Card number</option>
              <option value="cost">Cost</option>
              <option value="power">Power</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-type">Type</label>
          <input
            id="f-type"
            className="input"
            list="f-type-list"
            placeholder="e.g. Straw Hat Crew"
            value={filters.type}
            onChange={(e) => patch({ type: e.target.value })}
          />
          <datalist id="f-type-list">
            {types.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="f-keyword">Keyword in text</label>
          <select
            id="f-keyword"
            className="input"
            value={filters.keyword}
            onChange={(e) => patch({ keyword: e.target.value as Filters['keyword'] })}
          >
            <option value="">Any</option>
            {KEYWORDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            <option value="Trigger">Has a [Trigger]</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-legal">Standard legality</label>
          <select
            id="f-legal"
            className="input"
            value={filters.legality}
            onChange={(e) => patch({ legality: e.target.value as Filters['legality'] })}
          >
            <option value="">Any</option>
            <option value="legal">Legal</option>
            <option value="banned">Banned</option>
            <option value="rotated">Rotated (block 1)</option>
            <option value="unknown">Unknown block</option>
          </select>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => patch({ verifiedOnly: e.target.checked })}
          />
          Verified only
        </label>
        {activeFilters > 0 && (
          <button
            type="button"
            className="btn small"
            onClick={() => patch({ ...emptyFilters(filters.set), query: filters.query })}
          >
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
          </button>
        )}
      </aside>
      <section className="results-pane" aria-label="Results">
        <div className="results-bar">
          <p role="status" aria-live="polite" className="count">
            {pending > 0
              ? `Loading ${wanted.length - pending} of ${wanted.length} set${wanted.length > 1 ? 's' : ''}…`
              : `${results.length} card${results.length === 1 ? '' : 's'} in ${scope}`}
          </p>
          {effective.set !== 'all' && filters.query.trim() && (
            <button type="button" className="btn small" onClick={() => patch({ set: 'all' })}>
              Search all sets
            </button>
          )}
          <span className="spacer" />
          <span className="subtle small">
            <kbd>/</kbd> search · arrows move · <kbd>Enter</kbd> inspect
          </span>
        </div>
        {error && (
          <p role="alert" className="notice warning-notice">
            {error}
          </p>
        )}
        {pending === 0 && results.length === 0 ? (
          <div className="empty">
            <p>No cards match.</p>
            {effective.set !== 'all' && <p className="muted">Only {effective.set} was searched.</p>}
          </div>
        ) : (
          <ResultsGrid
            cards={results}
            active={Math.min(active, Math.max(0, results.length - 1))}
            onActive={setActive}
            onOpen={(card, tile) => {
              opener.current = tile;
              setOpen(card);
            }}
          />
        )}
      </section>
      {open && (
        <Inspector
          key={open.id}
          card={open}
          onClose={() => {
            setOpen(null);
            opener.current?.focus();
          }}
        />
      )}
    </main>
  );
}
