/**
 * The deck builder's keyboard and import checks, as pure functions (F17 step 1, M10 WP7): the card
 * grid is one roving tab stop, `A` cycles a card's art, and a JSON import never drops an entry
 * without a line saying so. No rules here.
 */
import type { Card } from '@optcg/cards';
import type { SavedDeck } from './store.ts';

export type GridKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

export const isGridKey = (k: string): k is GridKey =>
  k === 'ArrowLeft' ||
  k === 'ArrowRight' ||
  k === 'ArrowUp' ||
  k === 'ArrowDown' ||
  k === 'Home' ||
  k === 'End';

/**
 * Where focus goes from tile `index` in a grid of `count` tiles laid out `cols` to a row, reading
 * order. Never wraps: at an edge focus stays. Down from a row above a short last row lands on the
 * last tile (a clamp), and Up from the first row stays. Other keys leave focus where it is.
 */
export function moveFocus(index: number, key: string, cols: number, count: number): number {
  if (count <= 0) return 0;
  const at = Math.min(Math.max(index, 0), count - 1);
  const c = Math.max(1, Math.floor(cols));
  switch (key) {
    case 'ArrowLeft':
      return Math.max(0, at - 1);
    case 'ArrowRight':
      return Math.min(count - 1, at + 1);
    case 'ArrowUp':
      return at - c >= 0 ? at - c : at;
    case 'ArrowDown':
      if (at + c < count) return at + c;
      return Math.floor(at / c) < Math.floor((count - 1) / c) ? count - 1 : at;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return at;
  }
}

/** The next art of a card for the deck, or null when the card has no alternates ("A" on a tile). */
export function cycleArt(d: SavedDeck, card: Card): { deck: SavedDeck; line: string } | null {
  const n = card.artworks.length;
  if (n < 2) return null;
  const cur = Math.max(
    0,
    card.artworks.findIndex((a) => a.artworkId === d.art[card.id]),
  );
  const next = (cur + 1) % n;
  return {
    deck: { ...d, art: { ...d.art, [card.id]: card.artworks[next]!.artworkId } },
    line: `${card.name}: art ${next + 1} of ${n}.`,
  };
}

/** No entry can add more cards than a deck holds (the same bound as a text line). */
const MAX_ENTRY_COUNT = 50;

/**
 * Check this app's JSON deck before the parser sees it (review M6-11). An entry whose count is not
 * a whole number from 1 to 50, or that is not a card entry at all, is named ("Entry 7: count “x” is
 * not a number, skipped") and removed from the text the parser reads, so the message is true: the
 * parser itself would clamp it to 0 or round it without a word. Text that is not a JSON object with
 * a `main` list passes through untouched (the parser reports that).
 */
export function sanitizeJsonDeck(text: string): { text: string; problems: string[] } {
  if (!text.trim().startsWith('{')) return { text, problems: [] };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { text, problems: [] };
  }
  const d = data as { main?: unknown };
  if (!d || typeof d !== 'object' || !Array.isArray(d.main)) return { text, problems: [] };
  const problems: string[] = [];
  const kept: unknown[] = [];
  d.main.forEach((x: unknown, i: number) => {
    const at = `Entry ${i + 1}`;
    if (typeof x === 'string') {
      kept.push(x);
      return;
    }
    if (!x || typeof x !== 'object' || !('id' in x)) {
      problems.push(`${at}: not a card entry (it needs an "id"), skipped`);
      return;
    }
    const raw = (x as { count?: unknown }).count;
    if (raw === undefined) {
      kept.push(x);
      return;
    }
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string' && raw.trim() !== ''
          ? Number(raw)
          : NaN;
    const shown = typeof raw === 'string' ? `“${raw}”` : (JSON.stringify(raw) ?? String(raw));
    if (!Number.isFinite(n)) problems.push(`${at}: count ${shown} is not a number, skipped`);
    else if (!Number.isInteger(n))
      problems.push(`${at}: count ${shown} is not a whole number, skipped`);
    else if (n < 1) problems.push(`${at}: count ${shown} is less than 1, skipped`);
    else if (n > MAX_ENTRY_COUNT)
      problems.push(
        `${at}: count ${shown} is more than a deck holds (${MAX_ENTRY_COUNT}), skipped`,
      );
    else kept.push(x);
  });
  if (problems.length === 0) return { text, problems };
  return { text: JSON.stringify({ ...d, main: kept }), problems };
}
