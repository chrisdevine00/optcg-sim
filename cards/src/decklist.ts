/**
 * Deck lists as text (flows F17 steps 4 and 5): parse and export the three common formats.
 *
 * - `compact`: `4xOP01-016` (OPTCGSim and many deck sites), the Leader as `1xOP17-039`.
 * - `count`: `4 OP01-016`.
 * - `limitless`: `4 Nami OP01-016` (Limitless TCG's text export).
 *
 * Parsing accepts any of them line by line, mixed, with or without a Leader line, and also the JSON
 * this app exports (`{ "leader": ..., "main": [...] }`). An alternate-art suffix (`OP01-016_p1`)
 * names the same card number: decks reference card numbers only (PROMPT "Data model"). Nothing here
 * decides legality; the engine's `deckIssues` does that.
 */
import type { Card } from './schema.ts';

export type DeckTextFormat = 'compact' | 'count' | 'limitless';

export interface ParsedLine {
  /** 1-based line number in the input. */
  line: number;
  text: string;
  status: 'ok' | 'leader' | 'unknownCard' | 'nameMismatch' | 'syntax' | 'extraLeader';
  id?: string;
  count?: number;
  /** The name the line gave (limitless format), when there is one. */
  name?: string;
  message?: string;
  /** For an unknown card ID: the card number its name matches (same product first). */
  suggestion?: string;
}

export interface ParsedDeck {
  /** The Leader's card number, or null when the list has none. */
  leader: string | null;
  /** Card numbers with repeats, in the order the lines gave them. */
  main: string[];
  lines: ParsedLine[];
}

/** `count`, an optional `x`, an optional name, the card number (any case, alt-art suffix), an optional name. */
const LINE =
  /^\s*(?:(\d+)(?:\s*[xX×](?=\s|[A-Za-z]+\d*-\d{3}))?\s*)?(?:(.*?)\s+)?\(?([A-Za-z]+\d*-\d{3})(?:_[A-Za-z]+\d*)?\)?(?:\s+(.+?))?\s*$/;
/** Blank lines, comments and the section headings deck sites print ("Characters (12)", "Events:"). */
const BLANK =
  /^\s*(?:$|#|\/\/|(?:leader|characters?|events?|stages?|main(?: deck)?|deck(?: list)?|don!*)\s*(?:\(\d+\))?\s*:?\s*$)/i;
/** A "Leader:" prefix before a card line. */
const LEADER_PREFIX = /^\s*leader\s*:?\s+/i;
/** A count after the card number ("OP01-016 x4", "OP01-016 4"; review N-1). */
const TRAILING_COUNT = /^\s*\(?([A-Za-z]+\d*-\d{3}(?:_[A-Za-z]+\d*)?)\)?\s*(?:[xX×]\s*)?(\d+)\s*$/;
/** A trailing comment after the card. */
const COMMENT = /\s+(?:#|\/\/).*$/;
/** No line can add more cards than a deck holds (review M6-10: a huge count froze the tab). */
const MAX_LINE_COUNT = 50;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');

/**
 * Parse a deck list. `lookup` resolves card numbers (unknown numbers are reported, not added).
 * `byName`, when given, lets an unknown number suggest the card its line's name matches.
 */
export function parseDeckText(
  text: string,
  lookup: (id: string) => Card | undefined,
  byName?: (name: string) => Card[],
): ParsedDeck {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return parseJson(trimmed, lookup);
  const out: ParsedDeck = { leader: null, main: [], lines: [] };
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    if (BLANK.test(raw)) return;
    const body = raw
      .replace(COMMENT, '')
      .replace(LEADER_PREFIX, '')
      .replace(TRAILING_COUNT, '$2 $1');
    const m = LINE.exec(body);
    if (!m) {
      out.lines.push({
        line,
        text: raw,
        status: 'syntax',
        message: 'Not a card line: expected "4xOP01-016", "4 OP01-016" or "4 Name OP01-016".',
      });
      return;
    }
    const count = m[1] === undefined ? 1 : Number(m[1]);
    if (count < 1 || count > MAX_LINE_COUNT) {
      out.lines.push({
        line,
        text: raw,
        status: 'syntax',
        message: `${count} copies: a line can add 1 to ${MAX_LINE_COUNT}.`,
      });
      return;
    }
    const name = (m[2] ?? m[4])?.trim() || undefined;
    const id = m[3]!.toUpperCase();
    const card = lookup(id);
    const base = { line, text: raw, id, count, ...(name ? { name } : {}) };
    if (!card) {
      const guess = name && byName ? suggest(id, name, byName) : undefined;
      out.lines.push({
        ...base,
        status: 'unknownCard',
        message: guess
          ? `Unknown card ID ${id}. The name matches ${guess.id} ${guess.name}.`
          : `Unknown card ID ${id}.`,
        ...(guess ? { suggestion: guess.id } : {}),
      });
      return;
    }
    if (card.category === 'Leader' && count === 1) {
      if (out.leader && out.leader !== id) {
        out.lines.push({
          ...base,
          status: 'extraLeader',
          message: `A second Leader (${id} ${card.name}); the deck already has ${out.leader}.`,
        });
        return;
      }
      out.leader = id;
      out.lines.push({ ...base, status: 'leader' });
      return;
    }
    for (let k = 0; k < count; k++) out.main.push(id);
    if (name && norm(name) !== norm(card.name))
      out.lines.push({
        ...base,
        status: 'nameMismatch',
        message: `"${name}" doesn't match ${id} (${card.name}): using the ID.`,
      });
    else out.lines.push({ ...base, status: 'ok' });
  });
  return out;
}

/** The card a mistyped number most likely means: same name, same product first, newest number. */
function suggest(id: string, name: string, byName: (name: string) => Card[]): Card | undefined {
  const want = norm(name);
  const same = byName(name).filter((c) => norm(c.name) === want);
  const prefix = id.split('-')[0];
  return same.find((c) => c.id.split('-')[0] === prefix) ?? same[0];
}

function parseJson(text: string, lookup: (id: string) => Card | undefined): ParsedDeck {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      leader: null,
      main: [],
      lines: [{ line: 1, text, status: 'syntax', message: 'Not valid JSON.' }],
    };
  }
  const d = data as { leader?: unknown; main?: unknown };
  const lines: ParsedLine[] = [];
  const leader = typeof d.leader === 'string' ? d.leader.replace(/_.*$/, '').toUpperCase() : null;
  if (leader && !lookup(leader))
    lines.push({
      line: 1,
      text: leader,
      status: 'unknownCard',
      message: `Unknown card ID ${leader}.`,
    });
  const main: string[] = [];
  const add = (id: string, n: number) => {
    const count = Number.isFinite(n) ? Math.max(0, Math.min(MAX_LINE_COUNT, Math.floor(n))) : 0;
    const base = id.replace(/_.*$/, '').toUpperCase();
    if (!lookup(base)) {
      lines.push({
        line: 1,
        text: id,
        status: 'unknownCard',
        id: base,
        count,
        message: `Unknown card ID ${base}.`,
      });
      return;
    }
    for (let k = 0; k < count; k++) main.push(base);
  };
  if (Array.isArray(d.main))
    for (const x of d.main) {
      if (typeof x === 'string') add(x, 1);
      else if (x && typeof x === 'object' && 'id' in x)
        add(String((x as { id: unknown }).id), Number((x as { count?: unknown }).count ?? 1));
    }
  else lines.push({ line: 1, text, status: 'syntax', message: 'JSON has no "main" list.' });
  return { leader: leader && lookup(leader) ? leader : null, main, lines };
}

/** Card numbers with their counts, in first-appearance order. */
export function groupDeck(main: readonly string[]): { id: string; count: number }[] {
  const m = new Map<string, number>();
  for (const id of main) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m].map(([id, count]) => ({ id, count }));
}

/** Export a deck as text: the Leader first, then one line per card number. */
export function exportDeckText(
  deck: { leader: string; main: readonly string[] },
  format: DeckTextFormat,
  nameOf: (id: string) => string = () => '',
): string {
  const line = (id: string, count: number) => {
    if (format === 'compact') return `${count}x${id}`;
    if (format === 'count') return `${count} ${id}`;
    const name = nameOf(id).trim();
    return name ? `${count} ${name} ${id}` : `${count} ${id}`;
  };
  return [line(deck.leader, 1), ...groupDeck(deck.main).map((g) => line(g.id, g.count))].join('\n');
}

/** Export a deck as this app's JSON. */
export function exportDeckJson(deck: { leader: string; main: readonly string[] }, name?: string) {
  return JSON.stringify(
    { ...(name ? { name } : {}), leader: deck.leader, main: groupDeck(deck.main) },
    null,
    2,
  );
}
