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

function Editor({ deck, cards }: { deck: SavedDeck; cards: Map<string, Card> }) {
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
  const remove = (cid: string, fromList = false) => {
    if (countOf(deck.main, cid) === 0) return;
    const next = removeCopy(deck, cid);
    update(next);
    setSaid(changeLine('Removed', cards.get(cid), cid, next));
    // The last copy's row leaves the deck list: focus its heading, not the page.
    if (fromList && countOf(next.main, cid) === 0) focusSoon(() => listTitle.current);
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

  const tileKeys = (e: KeyboardEvent, c: Card) => {
    if (!leader) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      add(c);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      remove(c.id);
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
      <section className="builder-browse" aria-label="Card browser">
        <a
          className="skip-link"
          href="#deck-name"
          onClick={(e) => {
            // Past the card grid's controls to the deck (review M6-2: 67 Tab stops otherwise).
            e.preventDefault();
            document.getElementById('deck-name')?.focus();
          }}
        >
          Skip to the deck
        </a>
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
          <ul className="builder-grid" aria-label={leader ? 'Cards' : 'Leaders'}>
            {results.slice(0, shown).map((c) => {
              const n = countOf(deck.main, c.id);
              const over = n > MAX_COPIES;
              return (
                <li
                  key={c.id}
                  className={`btile${n ? ' in-deck' : ''}${flagged.has(c.id) ? ' bad' : ''}`}
                  onKeyDown={(e) => tileKeys(e, c)}
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
                        // Not `disabled`: a disabled button drops keyboard focus (review M6-2).
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
                        onClick={() => add(c)}
                      >
                        +
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn small"
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
        <div className="builder-deck-scroll">
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
          {groups.map((g) => (
            <section key={g.label} className="deck-group" aria-label={g.label}>
              <h3>{g.label}</h3>
              <ul>
                {g.rows.map((r) => (
                  <li key={r.id} className={flagged.has(r.id) ? 'bad' : ''}>
                    <span className="num deck-n">{r.count}</span>
                    <span className="deck-row-name">
                      {r.card?.name ?? r.id} <span className="subtle num small">{r.id}</span>
                      {r.count > MAX_COPIES && <strong className="danger small"> · max 4</strong>}
                    </span>
                    <ArtSwitch card={r.card} deck={deck} onChange={update} />
                    <button
                      type="button"
                      className="iconbtn"
                      aria-label={`Remove one ${r.card?.name ?? r.id}`}
                      onClick={() => remove(r.id, true)}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="iconbtn"
                      aria-label={`Add one ${r.card?.name ?? r.id}`}
                      disabled={!r.card}
                      onClick={() => r.card && add(r.card)}
                    >
                      +
                    </button>
                  </li>
                ))}
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
      aria-label={`Art ${cur + 1} of ${card.artworks.length} for ${card.name}: show the next`}
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
