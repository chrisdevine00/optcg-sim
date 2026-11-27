/**
 * Decks (flows F17): `/decks` lists saved decks; `/decks/<id>` is the builder. Two panes: the card
 * browser (filtered to the Leader's colours and the deck's format by default) and the deck with
 * live checks, coverage, import, export and "Play with / against this deck". Every change saves at
 * once (DECISIONS 2026-11-23 "M6 deck storage": no unsaved state, so no leave dialog).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CATEGORIES, type Card, type CardCategory } from '@optcg/cards';
import { manifest } from '@optcg/cards/browser';
import { CardFace } from '../art/index.ts';
import { META_IDS } from '../cards/meta.ts';
import { emptyFilters, filterCards, type CostFilter } from '../cards/filters.ts';
import { DECKS } from '../play/setup/decks.ts';
import { Link, navigate, usePath } from '../router.tsx';
import { useAllCards } from './allCards.ts';
import { ExportDialog } from './ExportDialog.tsx';
import { ImportDialog } from './ImportDialog.tsx';
import { cycleArt, isGridKey, moveFocus } from './keys.ts';
import {
  addCopy,
  blocking,
  changeLine,
  checkRows,
  countOf,
  coverageLine,
  deckCoverage,
  fitsLeader,
  groupByCost,
  issuesOf,
  legalIn,
  MAX_COPIES,
  removeCopy,
} from './model.ts';
import {
  createDeck,
  deleteDeck,
  saveDeck,
  saveError,
  savedDecks,
  subscribeDecks,
  type SavedDeck,
} from './store.ts';
import './decks.css';

const setIndex = new Map(manifest.sets.map((s, i) => [s.code, i]));
const setOrder = (code: string) => setIndex.get(code) ?? 999;
const PAGE = 60;
const COSTS: CostFilter[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

/** The builder's shortcut sheet (accessibility §3.15: single keys act only while the grid or list has focus). */
const BUILDER_KEYS: [string, string][] = [
  ['/', 'Search the cards'],
  ['← → ↑ ↓', 'Move between cards (grid) or rows (deck list); focus never wraps'],
  ['Home / End', 'First / last card or row'],
  ['Enter or +', 'Add one copy of the focused card'],
  ['Backspace or −', 'Remove one copy'],
  ['A', 'Show the next art of the focused card, if it has one'],
  ['↓ in the search box', 'Go to the results'],
  ['Escape', 'Back to the search box (from the grid)'],
];

export const deckPath = (id: string) => `/decks/${id.replace(/^saved:/, '')}`;

function useDecks(): readonly SavedDeck[] {
  return useSyncExternalStore(subscribeDecks, savedDecks, savedDecks);
}

export default function DecksRoute() {
  const path = usePath();
  const m = /^\/decks\/(.+)$/.exec(path);
  if (m) return <Builder key={m[1]} id={`saved:${m[1]}`} />;
  return <DeckList />;
}

// ------------------------------------------------------------------------------------------------
// The list of saved decks
// ------------------------------------------------------------------------------------------------

function DeckList() {
  const decks = useDecks();
  const { cards } = useAllCards();
  const [from, setFrom] = useState('');
  const newDeck = (init?: Partial<SavedDeck>) => navigate(deckPath(createDeck(init).id));
  return (
    <main className="page decks-page" id="main">
      <h1 className="browser-title">Decks</h1>
      <p className="lede">
        Build a deck, or start from a tournament list. Decks are saved in this browser only.
      </p>
      <div className="deck-start">
        <button type="button" className="btn primary" onClick={() => newDeck()}>
          New deck
        </button>
        <span className="field deck-from">
          <label htmlFor="deck-from">Start from a meta list</label>
          <span className="deck-from-row">
            <select
              id="deck-from"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              <option value="">Choose a list…</option>
              {DECKS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}: {d.source}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn"
              disabled={!from}
              onClick={() => {
                const d = DECKS.find((x) => x.id === from)!;
                newDeck({ name: `${d.name} (copy)`, leader: d.spec.leader, main: d.spec.main });
              }}
            >
              Copy list
            </button>
          </span>
        </span>
      </div>
      <h2 className="deck-h2">Your decks</h2>
      {decks.length === 0 ? (
        <p className="muted">No saved decks yet.</p>
      ) : (
        <ul className="deck-cards">
          {[...decks]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((d) => {
              const lookup = (id: string) => cards?.get(id);
              const errs = cards ? blocking(issuesOf(d, lookup)) : [];
              const leader = d.leader ? cards?.get(d.leader) : undefined;
              return (
                <li key={d.id} className="deck-card">
                  <Link to={deckPath(d.id)} className="deck-card-link">
                    <span className="deck-card-name">{d.name}</span>
                    <span className="muted small">
                      {leader ? `${leader.name} ${leader.id}` : 'No Leader yet'} · {d.main.length}{' '}
                      cards · {d.format === 'standard' ? 'Standard' : 'Extra Regulation'}
                    </span>
                    {cards && (
                      <span className={`small ${errs.length || !d.leader ? 'danger' : 'ok-text'}`}>
                        {!d.leader
                          ? 'Choose a Leader'
                          : errs.length
                            ? `${errs.length} problem${errs.length === 1 ? '' : 's'}`
                            : '✓ Ready to play'}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </main>
  );
}

// ------------------------------------------------------------------------------------------------
// The builder
// ------------------------------------------------------------------------------------------------

function Builder({ id }: { id: string }) {
  const decks = useDecks();
  const deck = decks.find((d) => d.id === id) ?? null;
  const { cards, error } = useAllCards();
  if (!deck)
    return (
      <main className="page" id="main">
        <h1>Deck not found</h1>
        <p>
          It may have been deleted. <Link to="/decks">Back to your decks</Link>
        </p>
      </main>
    );
  if (!cards)
    return (
      <main className="page" id="main" aria-busy={!error}>
        <p>{error ? `The card data could not load: ${error}` : 'Loading cards…'}</p>
      </main>
    );
  return <Editor deck={deck} cards={cards} />;
}

interface BrowserFilters {
  query: string;
  cost: CostFilter;
  category: '' | CardCategory;
  fitOnly: boolean;
  legalOnly: boolean;
  metaOnly: boolean;
  automatedOnly: boolean;
}

export function Editor({ deck, cards }: { deck: SavedDeck; cards: Map<string, Card> }) {
  const lookup = (x: string) => cards.get(x);
  const leader = deck.leader ? cards.get(deck.leader) : undefined;
  const [f, setF] = useState<BrowserFilters>({
    query: '',
    cost: '',
    category: '',
    fitOnly: true,
    legalOnly: true,
    metaOnly: false,
    automatedOnly: false,
  });
  const [shown, setShown] = useState(PAGE);
  const [dialog, setDialog] = useState<'import' | 'export' | null>(null);
  const [said, setSaid] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const importBtn = useRef<HTMLButtonElement>(null);
  const exportBtn = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState('');
  // The two composite widgets: one tab stop each, the active item moves with the arrow keys.
  const [gridIdx, setGridIdx] = useState(0);
  const [deckIdx, setDeckIdx] = useState(0);
  const gridRef = useRef<HTMLUListElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteBtn = useRef<HTMLButtonElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmDelete) confirmBtn.current?.focus();
  }, [confirmDelete]);
  const update = (next: SavedDeck) => saveDeck(next);
  /** Focus after React has re-rendered (the control that had it may be gone; review M6-2). */
  const focusSoon = (el: () => HTMLElement | null) => requestAnimationFrame(() => el()?.focus());
  const patch = (p: Partial<BrowserFilters>) => {
    setF((x) => ({ ...x, ...p }));
    setShown(PAGE);
    setGridIdx(0);
  };

  const issues = useMemo(() => issuesOf(deck, lookup), [deck, cards]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = checkRows(deck, issues);
  const errors = blocking(issues);
  const flagged = new Set(errors.flatMap((i) => i.cards));
  const cov = useMemo(() => deckCoverage(deck.main, lookup), [deck.main, cards]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupByCost(deck.main, lookup), [deck.main, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const base = {
      ...emptyFilters('all'),
      query: f.query,
      cost: f.cost,
      categories: leader ? (f.category ? [f.category] : []) : (['Leader'] as CardCategory[]),
      automatedOnly: f.automatedOnly,
    };
    const found = filterCards([...cards.values()], base, setOrder).filter(
      (c) =>
        (!f.fitOnly || fitsLeader(c, leader)) &&
        (!f.legalOnly || legalIn(c, deck.format)) &&
        (!f.metaOnly || META_IDS.has(c.id)),
    );
    if (f.query.trim()) return found;
    // No search: cards in the deck first, then meta-list cards, then the newest sets.
    const inDeck = new Set(deck.main);
    const rank = (c: Card) => (inDeck.has(c.id) ? 0 : META_IDS.has(c.id) ? 1 : 2);
    return found
      .map((c, i) => ({ c, i }))
      .sort((a, b) => rank(a.c) - rank(b.c) || setOrder(b.c.set) - setOrder(a.c.set) || a.i - b.i)
      .map((x) => x.c);
    // The order is fixed when the browser opens or filters change, not on every add.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, f, leader, deck.format]);

  const add = (c: Card) => {
    const next = addCopy(deck, c.id);
    update(next);
    setSaid(changeLine('Added', c, c.id, next));
  };
  const remove = (cid: string, fromList: boolean | number = false) => {
    if (countOf(deck.main, cid) === 0) return;
    const next = removeCopy(deck, cid);
    update(next);
    setSaid(changeLine('Removed', cards.get(cid), cid, next));
    if (fromList !== false && countOf(next.main, cid) === 0) {
      // The last copy's row leaves the deck list. From the keyboard (a row index): the row now at
      // that place, or the one before it. From a click: the list heading, not the page.
      if (typeof fromList === 'number') {
        const left = new Set(next.main).size;
        if (left === 0) focusSoon(() => listTitle.current);
        else {
          const at = Math.min(fromList, left - 1);
          setDeckIdx(at);
          focusSoon(() => deckRows()[at] ?? listTitle.current);
        }
      } else focusSoon(() => listTitle.current);
    }
  };
  const deckRows = () => [
    ...(deckRef.current?.querySelectorAll<HTMLElement>('li[data-deckrow]') ?? []),
  ];
  const gridTiles = () => [
    ...(gridRef.current?.querySelectorAll<HTMLElement>(':scope > li') ?? []),
  ];
  const focusTile = (i: number) => {
    setGridIdx(i);
    gridTiles()[i]?.focus();
  };
  const cycle = (c: Card) => {
    const r = cycleArt(deck, c);
    if (!r) return setSaid(`${c.name} has no other art.`);
    update(r.deck);
    setSaid(r.line);
  };
  const chooseLeader = (c: Card) => {
    update({ ...deck, leader: c.id });
    setSaid(`Leader: ${c.name}. The browser now shows cards in its colours.`);
    focusSoon(() => search.current);
  };
  const closeDialog = () => {
    const opener = dialog === 'export' ? exportBtn : importBtn;
    setDialog(null);
    focusSoon(() => opener.current);
  };
  const error = saveError();

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        e.key === '/' &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Columns in the grid now: the tiles that share the first tile's row (it reflows with the width). */
  const gridCols = () => {
    const t = gridTiles();
    if (t.length === 0) return 1;
    return Math.max(1, t.filter((x) => x.offsetTop === t[0]!.offsetTop).length);
  };
  const shownCards = results.slice(0, shown);
  const activeTile = Math.min(gridIdx, Math.max(0, shownCards.length - 1));
  /**
   * One tab stop for the card grid (review M6-3). Arrows, Home and End move between tiles; Enter or
   * + adds a copy; Backspace or − removes one; A cycles the art; Escape goes back to the search box.
   * Single keys act only on the tile itself (accessibility §3.15); +/− also work from its buttons.
   */
  const tileKeys = (e: KeyboardEvent, c: Card, i: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onTile = e.target === e.currentTarget;
    if (onTile && isGridKey(e.key)) {
      e.preventDefault();
      focusTile(moveFocus(i, e.key, gridCols(), shownCards.length));
    } else if (onTile && e.key === 'Escape') {
      e.preventDefault();
      search.current?.focus();
    } else if (!leader) {
      if (onTile && e.key === 'Enter') {
        e.preventDefault();
        chooseLeader(c);
      }
    } else if (e.key === '+' || e.key === '=' || (onTile && e.key === 'Enter')) {
      e.preventDefault();
      add(c);
    } else if (e.key === '-' || e.key === '_' || (onTile && e.key === 'Backspace')) {
      e.preventDefault();
      remove(c.id);
    } else if (onTile && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      cycle(c);
    }
  };
  /** The deck list's rows, flattened in reading order, for its one tab stop. */
  const flatRows = groups.flatMap((g) => g.rows);
  const activeRow = Math.min(deckIdx, Math.max(0, flatRows.length - 1));
  const rowKeys = (e: KeyboardEvent, r: (typeof flatRows)[number], i: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onRow = e.target === e.currentTarget;
    if (
      onRow &&
      (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'End')
    ) {
      e.preventDefault();
      const to = moveFocus(i, e.key, 1, flatRows.length);
      setDeckIdx(to);
      deckRows()[to]?.focus();
    } else if (onRow && e.key === 'Escape') {
      e.preventDefault();
      listTitle.current?.focus();
    } else if (e.key === '+' || e.key === '=' || (onRow && e.key === 'Enter')) {
      e.preventDefault();
      if (r.card) add(r.card);
    } else if (e.key === '-' || e.key === '_' || (onRow && e.key === 'Backspace')) {
      e.preventDefault();
      remove(r.id, i);
    } else if (onRow && (e.key === 'a' || e.key === 'A') && r.card) {
      e.preventDefault();
      cycle(r.card);
    }
  };

  const playBlocker = !deck.leader
    ? 'Choose a Leader first'
    : errors.length
      ? `Fix ${errors.length} problem${errors.length === 1 ? '' : 's'} first: ${errors
          .slice(0, 2)
          .map((e) => e.message.replace(/\.$/, ''))
          .join('; ')}`
      : null;

  return (
    <main className="builder" id="main">
      <h1 className="sr-only">Deck builder</h1>
      <section className="builder-browse" aria-label="Card browser">
        <div className="builder-search">
          <label className="sr-only" htmlFor="deck-search">
            Search cards
          </label>
          <input
            id="deck-search"
            ref={search}
            className="input"
            type="search"
            placeholder="Search name, ID, type or text   /"
            value={f.query}
            onChange={(e) => patch({ query: e.target.value })}
            onKeyDown={(e) => {
              // Down goes from the search box straight to the results, past the filters.
              if (e.key === 'ArrowDown' && shownCards.length > 0) {
                e.preventDefault();
                focusTile(activeTile);
              }
            }}
          />
          <span className="muted small" role="status">
            {results.length} result{results.length === 1 ? '' : 's'}
            {leader
              ? f.fitOnly
                ? ` · ${leader.colors.join('/')} (your Leader)`
                : ''
              : ' · choose a Leader'}
          </span>
        </div>
        <div className="builder-filters">
          {leader && (
            <>
              <label className="sr-only" htmlFor="deck-cost">
                Cost
              </label>
              <select
                id="deck-cost"
                className="input fselect"
                value={f.cost}
                onChange={(e) => patch({ cost: e.target.value as CostFilter })}
              >
                <option value="">Any cost</option>
                {COSTS.map((c) => (
                  <option key={c} value={c}>
                    Cost {c}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="deck-cat">
                Category
              </label>
              <select
                id="deck-cat"
                className="input fselect"
                value={f.category}
                onChange={(e) => patch({ category: e.target.value as BrowserFilters['category'] })}
              >
                <option value="">Any category</option>
                {CATEGORIES.filter((c) => c !== 'Leader').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Toggle on={f.fitOnly} onChange={(v) => patch({ fitOnly: v })}>
                Leader’s colours
              </Toggle>
            </>
          )}
          <Toggle on={f.legalOnly} onChange={(v) => patch({ legalOnly: v })}>
            {deck.format === 'standard' ? 'Standard-legal' : 'Not banned'}
          </Toggle>
          <Toggle on={f.metaOnly} onChange={(v) => patch({ metaOnly: v })}>
            In meta lists
          </Toggle>
          <Toggle on={f.automatedOnly} onChange={(v) => patch({ automatedOnly: v })}>
            Automated only
          </Toggle>
        </div>
        <div className="builder-scroll">
          <a
            className="skip-link"
            href="#deck-name"
            onClick={(e) => {
              // Past the card grid to the deck (review M6-2, M6-3, N-2).
              e.preventDefault();
              document.getElementById('deck-name')?.focus();
            }}
          >
            Skip to the deck
          </a>
          <p id="grid-keys" className="sr-only">
            Arrow keys move between cards. Enter or plus adds a copy, Backspace or minus removes
            one, A changes the art, Escape returns to search.
          </p>
          <ul
            ref={gridRef}
            className="builder-grid"
            aria-label={leader ? 'Cards' : 'Leaders'}
            aria-describedby="grid-keys"
          >
            {shownCards.map((c, i) => {
              const n = countOf(deck.main, c.id);
              const over = n > MAX_COPIES;
              return (
                <li
                  key={c.id}
                  className={`btile${n ? ' in-deck' : ''}${flagged.has(c.id) ? ' bad' : ''}`}
                  // One tab stop: the active tile is in the order, the rest are reached by arrows.
                  tabIndex={i === activeTile ? 0 : -1}
                  aria-label={
                    leader
                      ? `${c.name} ${c.id}, ${n} of ${MAX_COPIES} in the deck`
                      : `${c.name} ${c.id}, Leader`
                  }
                  data-tile={i}
                  onFocus={() => setGridIdx(i)}
                  onKeyDown={(e) => tileKeys(e, c, i)}
                >
                  <span className="btile-face" title={`${c.name} ${c.id}`}>
                    <CardFace card={c} artwork={artworkFor(c, deck)} tile />
                  </span>
                  <span className="btile-name subtle num">{c.id}</span>
                  {leader ? (
                    <span className="btile-ctl">
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Remove one ${c.name} ${c.id}`}
                        // The keys on the tile do this; the buttons are for the pointer, out of the
                        // tab order (review M6-3, N-2). Not `disabled`: it would drop focus (M6-2).
                        tabIndex={-1}
                        aria-disabled={n === 0 ? true : undefined}
                        onClick={() => remove(c.id)}
                      >
                        −
                      </button>
                      <span className={`num ${over ? 'danger' : ''}`}>
                        {over ? '✕ ' : ''}
                        {n}/{MAX_COPIES}
                      </span>
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Add one ${c.name} ${c.id}`}
                        tabIndex={-1}
                        onClick={() => add(c)}
                      >
                        +
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn small"
                      tabIndex={-1}
                      aria-label={`Choose ${c.name} ${c.id} as Leader`}
                      onClick={() => chooseLeader(c)}
                    >
                      Choose
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {results.length > shown && (
            <button
              type="button"
              className="btn show-more"
              onClick={() => setShown((s) => s + PAGE)}
            >
              Show {Math.min(PAGE, results.length - shown)} more ({shown} of {results.length} shown)
            </button>
          )}
        </div>
      </section>

      <section className="builder-deck" aria-label="Deck">
        <a
          className="skip-link"
          href="#grid"
          onClick={(e) => {
            // And back: from the deck to the card grid (review N-2).
            e.preventDefault();
            (gridTiles()[activeTile] ?? search.current)?.focus();
          }}
        >
          Skip to the card grid
        </a>
        <div className="builder-deck-head">
          <label className="sr-only" htmlFor="deck-name">
            Deck name
          </label>
          <input
            id="deck-name"
            className="input deck-name"
            value={deck.name}
            onChange={(e) => update({ ...deck, name: e.target.value })}
          />
          <div className="builder-deck-meta">
            {leader ? (
              <span className="chip outline">
                Leader {leader.id} {leader.name}
              </span>
            ) : (
              <span className="chip warning">No Leader</span>
            )}
            {leader && (
              <button
                type="button"
                className="linkbtn small"
                onClick={() => {
                  update({ ...deck, leader: null });
                  setSaid('Choose a new Leader: the browser shows Leaders.');
                  focusSoon(() => search.current);
                }}
              >
                Change Leader
              </button>
            )}
            <label className="sr-only" htmlFor="deck-format">
              Format
            </label>
            <select
              id="deck-format"
              className="input fselect"
              value={deck.format}
              onChange={(e) => update({ ...deck, format: e.target.value as SavedDeck['format'] })}
            >
              <option value="standard">Standard</option>
              <option value="extra">Extra Regulation</option>
            </select>
          </div>
          <div className="builder-deck-actions">
            <button
              ref={importBtn}
              type="button"
              className="btn small"
              onClick={() => setDialog('import')}
            >
              Import
            </button>
            <button
              ref={exportBtn}
              type="button"
              className="btn small"
              disabled={!deck.leader}
              onClick={() => setDialog('export')}
            >
              Export
            </button>
            {confirmDelete ? (
              <span
                className="delete-confirm"
                role="group"
                aria-label="Delete this deck?"
                onKeyDown={(e) => {
                  if (e.key !== 'Escape') return;
                  setConfirmDelete(false);
                  focusSoon(() => deleteBtn.current);
                }}
              >
                <span className="small">Delete “{deck.name}”? This cannot be undone.</span>
                <button
                  type="button"
                  className="btn small danger-btn"
                  onClick={() => {
                    deleteDeck(deck.id);
                    navigate('/decks');
                  }}
                >
                  Delete deck
                </button>
                <button
                  ref={confirmBtn}
                  type="button"
                  className="btn small"
                  onClick={() => {
                    setConfirmDelete(false);
                    focusSoon(() => deleteBtn.current);
                  }}
                >
                  Keep it
                </button>
              </span>
            ) : (
              <button
                ref={deleteBtn}
                type="button"
                className="btn small"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="notice warning-notice deck-save-error" role="alert">
            {error}
          </p>
        )}
        <div className="builder-deck-scroll" ref={deckRef}>
          {leader && (
            <ul className="checks" aria-label="Deck checks">
              {rows.map((r) => (
                <li key={r.label} className={r.ok ? 'ok' : 'fail'}>
                  <span aria-hidden="true">{r.ok ? '✓' : '✕'}</span>{' '}
                  <span className="sr-only">{r.ok ? 'Passes:' : 'Fails:'}</span>
                  {r.label} <span className="subtle small">({r.rule})</span>
                  {r.detail.map((d) => (
                    <span key={d} className={`check-detail ${r.ok ? 'warn' : ''}`}>
                      {d}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          )}
          <div className="deck-cov">
            <strong>{coverageLine(cov)}</strong>
            <div
              className="deck-cov-bar"
              role="img"
              aria-label={`${cov.copies ? Math.round((cov.copiesFull / cov.copies) * 100) : 0}% of cards automated`}
            >
              <span style={{ width: `${cov.copies ? (cov.copiesFull / cov.copies) * 100 : 0}%` }} />
            </div>
            {cov.statsOnly.length > 0 && (
              <details>
                <summary className="small">
                  {cov.statsOnly.reduce((n, s) => n + s.count, 0)} cards play for stats only:{' '}
                  {cov.statsOnly.map((s) => s.name).join(', ')}
                </summary>
                <p className="small muted">
                  Plays for its power and Counter; its effect won’t happen. Keywords like Blocker
                  still work where listed.
                </p>
              </details>
            )}
          </div>
          <h2 className="deck-list-title" ref={listTitle} tabIndex={-1}>
            Deck list · {deck.main.length} cards
          </h2>
          <p id="deck-keys" className="sr-only">
            Arrow keys move between rows. Enter or plus adds a copy, Backspace or minus removes one,
            A changes the art.
          </p>
          {groups.map((g) => (
            <section key={g.label} className="deck-group" aria-label={g.label}>
              <h3>{g.label}</h3>
              <ul aria-describedby="deck-keys">
                {g.rows.map((r) => {
                  const i = flatRows.indexOf(r);
                  return (
                    <li
                      key={r.id}
                      className={flagged.has(r.id) ? 'bad' : ''}
                      data-deckrow={i}
                      tabIndex={i === activeRow ? 0 : -1}
                      aria-label={`${r.card?.name ?? r.id} ${r.id}, ${r.count} ${r.count === 1 ? 'copy' : 'copies'}`}
                      onFocus={() => setDeckIdx(i)}
                      onKeyDown={(e) => rowKeys(e, r, i)}
                    >
                      <span className="num deck-n">{r.count}</span>
                      <span className="deck-row-name">
                        {r.card?.name ?? r.id} <span className="subtle num small">{r.id}</span>
                        {r.count > MAX_COPIES && <strong className="danger small"> · max 4</strong>}
                      </span>
                      <ArtSwitch card={r.card} deck={deck} onChange={update} />
                      <button
                        type="button"
                        className="iconbtn"
                        tabIndex={-1}
                        aria-label={`Remove one ${r.card?.name ?? r.id}`}
                        onClick={() => remove(r.id, true)}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="iconbtn"
                        tabIndex={-1}
                        aria-label={`Add one ${r.card?.name ?? r.id}`}
                        disabled={!r.card}
                        onClick={() => r.card && add(r.card)}
                      >
                        +
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="builder-deck-foot">
          <Link
            to={`/play?p1=${encodeURIComponent(deck.id)}`}
            className={`btn primary${playBlocker ? ' disabled' : ''}`}
            aria-disabled={playBlocker ? true : undefined}
            onClick={(e) => playBlocker && e.preventDefault()}
          >
            Play with this deck
          </Link>
          <Link
            to={`/play?p2=${encodeURIComponent(deck.id)}`}
            className={`btn${playBlocker ? ' disabled' : ''}`}
            aria-disabled={playBlocker ? true : undefined}
            onClick={(e) => playBlocker && e.preventDefault()}
          >
            Play against this deck
          </Link>
          {playBlocker && <p className="danger small foot-why">{playBlocker}</p>}
          {/* The builder's shortcut sheet: last in the order, so it adds no stop before the deck. */}
          <details className="builder-keys">
            <summary className="small">Keyboard shortcuts</summary>
            <table className="tbl keys-table">
              <tbody>
                {BUILDER_KEYS.map(([k, d]) => (
                  <tr key={k}>
                    <th scope="row">
                      <kbd>{k}</kbd>
                    </th>
                    <td>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>
      {dialog === 'import' && (
        <ImportDialog
          cards={cards}
          leader={deck.leader}
          format={deck.format}
          draft={draft}
          onDraft={setDraft}
          onClose={closeDialog}
          onImport={(d) => {
            update({ ...deck, leader: d.leader, main: d.main });
            closeDialog();
            setDraft('');
            setSaid(`Imported ${d.main.length} cards.`);
          }}
        />
      )}
      {dialog === 'export' && deck.leader && (
        <ExportDialog
          name={deck.name}
          deck={{ leader: deck.leader, main: deck.main }}
          cards={cards}
          onClose={closeDialog}
        />
      )}
    </main>
  );
}

function artworkFor(c: Card, deck: SavedDeck) {
  const want = deck.art[c.id];
  return (want && c.artworks.find((a) => a.artworkId === want)) || c.artworks[0];
}

/** Alt art per card (F17 step 6): cosmetic, saved with the deck. */
function ArtSwitch({
  card,
  deck,
  onChange,
}: {
  card: Card | undefined;
  deck: SavedDeck;
  onChange: (d: SavedDeck) => void;
}) {
  if (!card || card.artworks.length < 2) return <span className="art-switch" />;
  const cur = Math.max(
    0,
    card.artworks.findIndex((a) => a.artworkId === deck.art[card.id]),
  );
  const next = (cur + 1) % card.artworks.length;
  return (
    <button
      type="button"
      className="btn small art-switch"
      tabIndex={-1}
      // The name starts with the visible text (WCAG 2.5.3, label in name).
      aria-label={`Art ${cur + 1}/${card.artworks.length}: show the next art of ${card.name}`}
      onClick={() =>
        onChange({ ...deck, art: { ...deck.art, [card.id]: card.artworks[next]!.artworkId } })
      }
    >
      Art {cur + 1}/{card.artworks.length}
    </button>
  );
}

function Toggle({
  on,
  onChange,
  children,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`fchip${on ? ' on' : ''}`}
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      {children}
      {on ? ' ✓' : ''}
    </button>
  );
}
