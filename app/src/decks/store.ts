/**
 * Saved decks (flows F17), local only: one `localStorage` entry holds every deck (a deck is a few
 * hundred bytes; DECISIONS 2026-11-23 "M6 deck storage"). Decks reference card numbers only; the
 * chosen alt art per card is cosmetic and stored with the deck.
 */
import type { DeckFormat } from '@optcg/engine';

export interface SavedDeck {
  /** `saved:<random>`; the prefix keeps it apart from the meta lists' ids in Setup. */
  id: string;
  name: string;
  leader: string | null;
  main: string[];
  format: Exclude<DeckFormat, 'free'>;
  /** Card number → artwork id (cosmetic). */
  art: Record<string, string>;
  updatedAt: string;
}

const KEY = 'optcg.decks.v1';
const listeners = new Set<() => void>();
let cache: SavedDeck[] | null = null;
/** The last write that failed (storage full or blocked), for the builder to say so (M6-6). */
let lastError: string | null = null;

const FORMATS = new Set(['standard', 'extra']);
const isId = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

/** One stored deck, repaired where it can be and dropped where it cannot (M6-5). */
function clean(x: unknown): SavedDeck | null {
  if (!x || typeof x !== 'object') return null;
  const d = x as Partial<SavedDeck>;
  if (!isId(d.id) || !d.id.startsWith('saved:')) return null;
  return {
    id: d.id,
    name: typeof d.name === 'string' ? d.name : 'Untitled deck',
    leader: isId(d.leader) ? d.leader : null,
    main: Array.isArray(d.main) ? d.main.filter(isId) : [],
    format: FORMATS.has(d.format as string) ? (d.format as SavedDeck['format']) : 'standard',
    art:
      d.art && typeof d.art === 'object'
        ? Object.fromEntries(Object.entries(d.art).filter(([, v]) => isId(v)))
        : {},
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date(0).toISOString(),
  };
}

/** Always from storage, so another tab's writes are never overwritten by a stale copy (M6-1). */
function load(): SavedDeck[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const all: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(all) ? all.flatMap((x) => clean(x) ?? []) : [];
  } catch {
    return cache ?? [];
  }
}

function read(): SavedDeck[] {
  cache ??= load();
  return cache;
}

/** Read-modify-write against storage, by id. */
function modify(change: (all: SavedDeck[]) => SavedDeck[]): void {
  // After a failed write, storage lacks this tab's edits: build on the in-memory copy.
  const next = change(lastError ? read() : load());
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    lastError = null;
  } catch (e) {
    lastError = `Your decks could not be saved in this browser (${e instanceof Error ? e.name : 'storage error'}). Changes last until you close the tab.`;
  }
  for (const fn of listeners) fn();
}

// Another tab changed the decks: drop the copy and tell every reader, subscribed or not.
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY && e.key !== null) return;
    cache = null;
    for (const fn of listeners) fn();
  });

export const saveError = (): string | null => lastError;

export const savedDecks = (): readonly SavedDeck[] => read();

/** Fresh from storage: Setup and game start see what the builder saved, even from another tab. */
export const savedDeck = (id: string): SavedDeck | undefined => load().find((d) => d.id === id);

export function subscribeDecks(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const newId = () => `saved:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function createDeck(init: Partial<Omit<SavedDeck, 'id' | 'updatedAt'>> = {}): SavedDeck {
  const d: SavedDeck = {
    id: newId(),
    name: init.name ?? 'New deck',
    leader: init.leader ?? null,
    main: init.main ?? [],
    format: init.format ?? 'standard',
    art: init.art ?? {},
    updatedAt: new Date().toISOString(),
  };
  modify((all) => [...all, d]);
  return d;
}

export function saveDeck(d: SavedDeck): void {
  const next = { ...d, updatedAt: new Date().toISOString() };
  modify((all) =>
    all.some((x) => x.id === d.id) ? all.map((x) => (x.id === d.id ? next : x)) : [...all, next],
  );
}

export function deleteDeck(id: string): void {
  modify((all) => all.filter((d) => d.id !== id));
}

/** Tests only: forget the in-memory copy. */
export function resetDeckCache(): void {
  cache = null;
}
