/**
 * M9 WP5: the rules reference's search. A hand-written token index, no dependency: lower-case word
 * tokens, prefix matching (every query word must start some word of the entry), the title worth three
 * times the body, and number queries (`7-1-4-1`, `CR 7-1-4`, `RL-18`, `item 17`) that match exactly
 * first and then by prefix, so `7-1-4` finds the entries that cite 7-1-4-1.
 */
import type { RuleEntry } from './types.ts';

export interface Hit {
  entry: RuleEntry;
  score: number;
  /** Why it matched: a rule number, or words. */
  how: 'number' | 'words';
}

interface Row {
  entry: RuleEntry;
  title: Set<string>;
  body: Set<string>;
}

export interface Index {
  rows: Row[];
}

/** Words: letters and digits, lower-case; `[Blocker]` and `K.O.` become `blocker` and `ko`. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\w)\.(?=\w\.)/g, '$1')
    .replace(/(\w)\.(?!\w)/g, '$1 ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function buildIndex(entries: readonly RuleEntry[]): Index {
  return {
    rows: entries.map((entry) => ({
      entry,
      title: new Set(tokens(entry.title)),
      body: new Set(
        tokens(
          [entry.text, entry.question ?? '', entry.section, entry.id, entry.cr.join(' ')].join(' '),
        ),
      ),
    })),
  };
}

/** What kind of number a query is, normalised: `7-1-4-1`, `RL-18` (as `RL-18`), `item/17`. */
export function numberQuery(q: string): { cr?: string; id?: string } | null {
  const withCr = /^cr\s*\d/i.test(q.trim());
  const t = q.trim().replace(/^cr\s*/i, '');
  if (/^\d+(?:[-.]\d+)*$/.test(t) && (withCr || /[-.]/.test(t))) {
    return { cr: t.replace(/\./g, '-') };
  }
  const rl = /^rl[-\s]?(\d{1,2})$/i.exec(t);
  if (rl) return { id: `RL-${rl[1]!.padStart(2, '0')}` };
  const item = /^item[\s/]?(\d{1,3})$/i.exec(t);
  if (item) return { id: `item/${Number(item[1])}` };
  return null;
}

export function search(index: Index, query: string): Hit[] {
  const q = query.trim();
  if (q === '') return [];
  const num = numberQuery(q);
  if (num) {
    const exact: Hit[] = [];
    const prefix: Hit[] = [];
    for (const r of index.rows) {
      const e = r.entry;
      if (num.id) {
        if (e.id === num.id) exact.push({ entry: e, score: 100, how: 'number' });
        continue;
      }
      const n = num.cr!;
      if (e.cr.includes(n)) exact.push({ entry: e, score: 100, how: 'number' });
      else if (e.cr.some((c) => c.startsWith(n + '-')))
        prefix.push({ entry: e, score: 50, how: 'number' });
    }
    return [...exact, ...prefix];
  }
  const words = tokens(q);
  if (words.length === 0) return [];
  const hits: Hit[] = [];
  for (const r of index.rows) {
    let score = 0;
    let all = true;
    for (const w of words) {
      const inTitle = [...r.title].some((t) => t.startsWith(w));
      const inBody = inTitle || [...r.body].some((t) => t.startsWith(w));
      if (!inBody) {
        all = false;
        break;
      }
      score += inTitle ? 3 : 1;
    }
    if (all) hits.push({ entry: r.entry, score, how: 'words' });
  }
  // Array sort is stable: equal scores stay in the files' order.
  return hits.sort((a, b) => b.score - a.score);
}
