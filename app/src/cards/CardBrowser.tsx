import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { COLORS, CATEGORIES, KEYWORDS, setCodeOf, type Card, type SetFile } from '@optcg/cards';
import { loadSet, manifest } from '@optcg/cards/browser';
import { retryArt, useArtStatus } from '../art/index.ts';
import { Inspector } from './Inspector.tsx';
import { ResultsGrid } from './ResultsGrid.tsx';
import {
  allTypes,
  emptyFilters,
  filterCards,
  filtersFromQuery,
  filtersToQuery,
  setFromQuery,
  type CostFilter,
  type Filters,
  type SortKey,
} from './filters.ts';

const NEWEST = manifest.newestSet;
const setIndex = new Map(manifest.sets.map((s, i) => [s.code, i]));
const setOrder = (code: string) => setIndex.get(code) ?? 999;
const ALL_SETS = manifest.sets.map((s) => s.code);
const COSTS: CostFilter[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
const KIND_LABEL = {
  booster: 'Boosters',
  extra: 'Extra boosters',
  premium: 'Premium boosters',
  starter: 'Starter decks',
  promo: 'Promotions',
};
const LEGALITY_LABEL: Record<string, string> = {
  legal: 'Legal',
  banned: 'Banned',
  rotated: 'Rotated',
  unknown: 'Unknown block',
  restricted: 'Restricted',
};
const SORT_LABEL: Record<SortKey, string> = {
  best: 'Best match',
  id: 'Number',
  cost: 'Cost',
  power: 'Power',
  name: 'Name',
};

const readUrl = () => {
  const p = new URLSearchParams(window.location.search);
  return { ...filtersFromQuery(p, NEWEST), card: p.get('card') };
};

/** The first real screen (M1): every English card, searchable and filterable, with an inspector. */
export default function CardBrowser() {
  const [initial] = useState(readUrl);
  const [filters, setFilters] = useState<Filters>(() => {
    const { setPicked: _p, card: _c, ...f } = initial;
    return f;
  });
  const [setPicked, setSetPicked] = useState(initial.setPicked);
  const [loaded, setLoaded] = useState<Map<string, SetFile>>(new Map());
  const [failed, setFailed] = useState<Map<string, string>>(new Map());
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState<string | null>(initial.card);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const art = useArtStatus();

  const patch = (p: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setActive(0);
  };

  // Scope (M1-01): a search covers every set unless the user picked one. A card number searches its set.
  const query = filters.query.trim();
  const idSet = setFromQuery(query);
  const scopeSet =
    query && !setPicked
      ? 'all'
      : idSet && setIndex.has(idSet) && filters.set !== 'all'
        ? idSet
        : filters.set;
  const effective = useMemo(() => ({ ...filters, set: scopeSet }), [filters, scopeSet]);

  // Card JSON loads per set, on demand. A search loads every set, so the all-sets count is always known.
  const openSet =
    openId && /^(OP|ST|EB|PRB)\d{2}-\d{3}$|^P-\d{3}$/.test(openId) ? setCodeOf(openId) : null;
  const wanted = useMemo(() => {
    const base = query || scopeSet === 'all' ? ALL_SETS : [scopeSet];
    return [...new Set([...base, ...(openSet && setIndex.has(openSet) ? [openSet] : [])])];
  }, [query, scopeSet, openSet]);
  useEffect(() => {
    let live = true;
    for (const code of wanted) {
      if (loaded.has(code) || failed.has(code)) continue;
      loadSet(code).then(
        (s) => live && setLoaded((m) => (m.has(code) ? m : new Map(m).set(code, s))),
        (e: unknown) => live && setFailed((m) => new Map(m).set(code, String(e))),
      );
    }
    return () => {
      live = false;
    };
  }, [wanted, loaded, failed]);

  const pending = wanted.filter((c) => !loaded.has(c) && !failed.has(c)).length;
  const failedHere = wanted.filter((c) => failed.has(c));
  const pool = useMemo(() => wanted.flatMap((c) => loaded.get(c)?.cards ?? []), [wanted, loaded]);
  const results = useMemo(() => filterCards(pool, effective, setOrder), [pool, effective]);
  const allSetsCount = useMemo(
    () =>
      query && scopeSet !== 'all'
        ? filterCards(pool, { ...effective, set: 'all' }, setOrder).length
        : null,
    [pool, effective, query, scopeSet],
  );
  const types = useMemo(() => allTypes(pool), [pool]);
  const openCard = useMemo(() => {
    if (!openId) return null;
    for (const s of loaded.values()) {
      const c = s.cards.find((x) => x.id === openId);
      if (c) return c;
    }
    return null;
  }, [openId, loaded]);
  const openIndex = openCard ? results.findIndex((c) => c.id === openCard.id) : -1;

  // URL mirrors the filters (replace) and the open card (push, so Back closes it) — M1-13.
  const urlFor = useCallback(
    (card: string | null) => {
      const p = filtersToQuery(filters, NEWEST);
      if (setPicked && !p.has('set')) p.set('set', filters.set);
      if (card) p.set('card', card);
      const qs = p.toString();
      return `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    },
    [filters, setPicked],
  );
  useEffect(() => {
    window.history.replaceState(window.history.state, '', urlFor(openId));
  }, [urlFor, openId]);
  useEffect(() => {
    const onPop = () => setOpenId(new URLSearchParams(window.location.search).get('card'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.title = openCard
      ? `${openCard.name} (${openCard.id}) · Cards · OPTCG Sim`
      : 'Cards · OPTCG Sim';
    return () => {
      document.title = 'OPTCG Sim';
    };
  }, [openCard]);

  // "/" focuses search (accessibility.md shortcut sheet).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(t.tagName) && !openId) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  const focusResults = () => {
    const grid = document.getElementById('results');
    if (!grid) return;
    grid.scrollTop = 0;
    setActive(0);
    requestAnimationFrame(() => grid.querySelector<HTMLElement>('[data-index="0"]')?.focus());
  };
  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'ArrowDown' || e.key === 'Enter') && results.length) {
      e.preventDefault();
      focusResults();
    }
  };

  const open = (card: Card, tile: HTMLElement | null) => {
    opener.current = tile;
    window.history.pushState({ inspector: true }, '', urlFor(card.id));
    setOpenId(card.id);
  };
  const close = () => {
    if (window.history.state?.inspector) window.history.back();
    setOpenId(null);
    // Focus returns to the card now open, which after Previous/Next may differ from the one clicked.
    const i = results.findIndex((c) => c.id === openId);
    if (i < 0) return opener.current?.focus();
    setActive(i);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`#results [data-index="${i}"]`)?.focus(),
    );
  };
  const step = (d: 1 | -1) => {
    const next = results[openIndex + d];
    if (!next) return;
    setActive(openIndex + d);
    opener.current = null;
    setOpenId(next.id);
  };

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const chips: { label: string; clear: () => void }[] = [
    ...filters.colors.map((c) => ({
      label: `Colour: ${c}`,
      clear: () => patch({ colors: filters.colors.filter((x) => x !== c) }),
    })),
    ...filters.categories.map((c) => ({
      label: c,
      clear: () => patch({ categories: filters.categories.filter((x) => x !== c) }),
    })),
    ...(filters.cost ? [{ label: `Cost ${filters.cost}`, clear: () => patch({ cost: '' }) }] : []),
    ...(filters.type ? [{ label: `Type: ${filters.type}`, clear: () => patch({ type: '' }) }] : []),
    ...(filters.keyword
      ? [{ label: `Keyword: ${filters.keyword}`, clear: () => patch({ keyword: '' }) }]
      : []),
    ...(filters.legality
      ? [
          {
            label: `Standard: ${LEGALITY_LABEL[filters.legality]}`,
            clear: () => patch({ legality: '' }),
          },
        ]
      : []),
    ...(filters.verifiedOnly
      ? [{ label: 'In meta decklists', clear: () => patch({ verifiedOnly: false }) }]
      : []),
  ];
  const clearAll = () =>
    patch({
      ...emptyFilters(filters.set),
      query: filters.query,
      sort: filters.sort,
      descending: filters.descending,
    });
  const scopeLabel =
    scopeSet === 'all'
      ? 'all sets'
      : scopeSet === NEWEST && !setPicked
        ? `${scopeSet} (newest set)`
        : scopeSet;
  const retrySets = () => setFailed(new Map());

  const status =
    failedHere.length > 0
      ? `Couldn't load ${failedHere.join(', ')}`
      : pending > 0
        ? `Loading ${wanted.length - pending} of ${wanted.length} set${wanted.length > 1 ? 's' : ''}…`
        : `${results.length} card${results.length === 1 ? '' : 's'} in ${scopeLabel}`;

  return (
    <main className="browser" id="main" aria-labelledby="browser-title">
      <section className="results-pane" aria-labelledby="browser-title">
        <div className="results-bar">
          <h1 id="browser-title" className="browser-title">
            Cards
          </h1>
          <div className="search">
            <label htmlFor="f-search" className="sr-only">
              Search cards by name, number or text
            </label>
            <input
              ref={search}
              id="f-search"
              className="input"
              type="search"
              placeholder="Name, number or text   /"
              value={filters.query}
              aria-keyshortcuts="/"
              aria-describedby="search-scope"
              aria-controls={results.length ? 'results' : undefined}
              onChange={(e) => patch({ query: e.target.value })}
              onKeyDown={onSearchKey}
            />
          </div>
          <button
            type="button"
            className="btn small filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            Filters{chips.length ? ` (${chips.length})` : ''}
          </button>
          <p role="status" aria-live="polite" className="count" id="search-scope">
            {status}
            {allSetsCount !== null && pending === 0 && (
              <>
                {' · '}
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => {
                    setSetPicked(false);
                    patch({ set: NEWEST });
                  }}
                >
                  {allSetsCount} in all sets
                </button>
              </>
            )}
          </p>
          <span className="subtle small keys">
            <kbd>/</kbd> search · <kbd>↓</kbd> to results · <kbd>Enter</kbd> inspect
          </span>
        </div>
        {chips.length > 0 && (
          <div className="chips-bar" role="group" aria-label="Active filters">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                className="fchip"
                onClick={c.clear}
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="linkbtn" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
        {failedHere.length > 0 && (
          <div role="alert" className="notice warning-notice load-error">
            <span>
              The card list didn't load. Check your connection, or reload: the site may have been
              updated.
            </span>
            <button type="button" className="btn small" onClick={retrySets}>
              Retry
            </button>
            <button type="button" className="btn small" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        )}
        {art.failures >= 3 && (
          <div className="notice art-notice" role="status">
            <span>Some card images didn't load, so those cards are shown as text.</span>
            <button type="button" className="btn small" onClick={retryArt}>
              Retry images
            </button>
          </div>
        )}
        {pending === 0 && failedHere.length === 0 && results.length === 0 ? (
          <div className="empty" id="results" tabIndex={-1}>
            <p>
              <b>No cards match</b>
              {query ? <> “{query}”</> : null} in {scopeLabel}
              {chips.length
                ? ` with ${chips.length} filter${chips.length > 1 ? 's' : ''} (${chips.map((c) => c.label).join(', ')})`
                : ''}
              .
            </p>
            <p className="row">
              {chips.length > 0 && (
                <button type="button" className="btn small" onClick={clearAll}>
                  Clear filters
                </button>
              )}
              {scopeSet !== 'all' && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() => {
                    setSetPicked(true);
                    patch({ set: 'all' });
                  }}
                >
                  Search all sets
                </button>
              )}
            </p>
          </div>
        ) : (
          <ResultsGrid
            cards={results}
            active={Math.min(active, Math.max(0, results.length - 1))}
            onActive={setActive}
            onOpen={(card, tile) => open(card, tile)}
          />
        )}
      </section>
      <aside className="filters" id="filters" aria-label="Filters" data-open={filtersOpen}>
        <div className="field">
          <label htmlFor="f-set">Set</label>
          <select
            id="f-set"
            className="input"
            value={scopeSet === 'all' && !setPicked ? 'all' : filters.set}
            onChange={(e) => {
              setSetPicked(true);
              patch({ set: e.target.value });
            }}
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
          <p className="hint">Search covers all sets unless you pick one here.</p>
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
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.descending}
            onChange={(e) => patch({ descending: e.target.checked })}
          />
          Reverse order
        </label>
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
          In meta decklists (verified)
        </label>
      </aside>
      {openCard && (
        <Inspector
          key="inspector"
          card={openCard}
          position={openIndex >= 0 ? { index: openIndex, total: results.length } : undefined}
          onPrev={openIndex > 0 ? () => step(-1) : undefined}
          onNext={openIndex >= 0 && openIndex < results.length - 1 ? () => step(1) : undefined}
          onClose={close}
        />
      )}
    </main>
  );
}
