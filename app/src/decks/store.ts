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

function read(): SavedDeck[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as SavedDeck[]) : [];
    cache = Array.isArray(all) ? all.filter((d) => d && typeof d.id === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(all: SavedDeck[]): void {
  cache = all;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: the decks stay for this session only.
  }
  for (const fn of listeners) fn();
}

export const savedDecks = (): readonly SavedDeck[] => read();

export const savedDeck = (id: string): SavedDeck | undefined => read().find((d) => d.id === id);

export function subscribeDecks(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    fn();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
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
  write([...read(), d]);
  return d;
}

export function saveDeck(d: SavedDeck): void {
  const next = { ...d, updatedAt: new Date().toISOString() };
  const all = read();
  const i = all.findIndex((x) => x.id === d.id);
  write(i >= 0 ? all.map((x, k) => (k === i ? next : x)) : [...all, next]);
}

export function deleteDeck(id: string): void {
  write(read().filter((d) => d.id !== id));
}

/** Tests only: forget the in-memory copy. */
export function resetDeckCache(): void {
  cache = null;
}
