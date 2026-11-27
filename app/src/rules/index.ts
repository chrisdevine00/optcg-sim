/**
 * M9 WP5: the rules reference's data. `buildRules` is pure (the tests feed it the files); `loadRules`
 * imports `data.ts`, which holds the raw Markdown, so the two research files are a lazy chunk and
 * never part of the first load. Rule ids: `item/17` (a digest item), `RL-18` (a ruling) and `cr/7-1-4-1`
 * (a Comprehensive Rules number: the entries that cite it).
 */
import { DEMOS } from './demos/index.ts';
import { parseDigest, parseRulings } from './parse.ts';
import { buildIndex, type Index } from './search.ts';
import type { RuleDemo, RuleEntry } from './types.ts';

export interface GlossaryTerm {
  term: string;
  meaning: string;
  rule: string;
}

export interface RulesData {
  entries: RuleEntry[];
  byId: Map<string, RuleEntry>;
  index: Index;
  glossary: GlossaryTerm[];
  /** The "As of" date each source file states. */
  asOf: { digest: string; rulings: string };
  /** Which Comprehensive Rules version the digest was read from, as its header says. */
  crVersion: string;
}

/** `**As of:** 2026-10-28` from a research file's header. */
export function asOfOf(text: string): string {
  return /^\*\*As of:\*\*\s*(\S+)/m.exec(text)?.[1] ?? '';
}

/** The terms of the glossary's rules sections (not the player and strategy slang). */
export function parseGlossary(text: string): GlossaryTerm[] {
  const out: GlossaryTerm[] = [];
  let rules = true;
  for (const line of text.split('\n')) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) rules = !/^Player and strategy/i.test(h[1]!);
    if (!rules || !line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 3 || cells[0] === 'Term' || /^-+$/.test(cells[0]!.replace(/\s/g, '')))
      continue;
    out.push({ term: cells[0]!, meaning: cells[1]!, rule: cells[2]! });
  }
  return out;
}

/** The words of a glossary term that a rule's text may use: `Life (value)` is `Life`, `[Blocker]` is `[Blocker]`. */
export function termForms(term: string): string[] {
  return term
    .split(/\s+\/\s+/)
    .map((t) =>
      t
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/^"|"$/g, '')
        .trim(),
    )
    .filter((t) => t.length >= 4 && !/^[①]/.test(t));
}

/** Which demos show an entry: by its own id, or (for a digest item) by a CR number it cites. */
export function demosFor(entry: RuleEntry, demos: readonly RuleDemo[] = DEMOS): RuleDemo[] {
  return demos.filter(
    (d) =>
      d.rulings?.includes(entry.id) ||
      d.rules.includes(entry.id) ||
      (entry.kind === 'digest' && d.rules.some((r) => entry.cr.includes(r))),
  );
}

export function buildRules(
  digestText: string,
  rulingsText: string,
  glossaryText: string,
  demos: readonly RuleDemo[] = DEMOS,
): RulesData {
  // A digest item that is only an engine note (item 73) has no rule to show: it is parsed, not listed.
  const parsed = [...parseDigest(digestText), ...parseRulings(rulingsText)].filter(
    (e) => e.text !== '',
  );
  const entries = parsed.map((e) => {
    const shown = demosFor(e, demos)[0];
    return shown ? { ...e, demo: shown.id } : e;
  });
  return {
    entries,
    byId: new Map(entries.map((e) => [e.id, e])),
    index: buildIndex(entries),
    glossary: parseGlossary(glossaryText),
    asOf: { digest: asOfOf(digestText), rulings: asOfOf(rulingsText) },
    crVersion: /Version ([\d.]+)/.exec(digestText)?.[1] ?? '',
  };
}

/** What `/rules/<id>` resolves to. */
export type Resolved =
  | { kind: 'entry'; entry: RuleEntry }
  | {
      kind: 'cr';
      cr: string;
      entries: RuleEntry[];
      /** `exact`: cited as written; `under`: cited by a deeper number; `parent`: cited by a shorter one. */
      via: 'exact' | 'under' | 'parent';
      /** The number the entries were found for. */
      matched: string;
    };

/** `cr/7-1-4-1` or `7-1-4-1` → `7-1-4-1`. */
export const crOfId = (id: string): string | null => {
  const m = /^(?:cr\/)?(\d+(?:-\d+)*)$/.exec(id);
  return m ? m[1]! : null;
};

export function resolveRule(data: RulesData, rawId: string): Resolved | null {
  const direct = data.byId.get(rawId) ?? data.byId.get(rawId.toUpperCase());
  if (direct) return { kind: 'entry', entry: direct };
  const cr = crOfId(rawId);
  if (!cr) return null;
  const parts = cr.split('-');
  for (let n = parts.length; n >= 1; n--) {
    const at = parts.slice(0, n).join('-');
    const exact = data.entries.filter((e) => e.cr.includes(at));
    if (exact.length)
      return {
        kind: 'cr',
        cr,
        entries: exact,
        via: n === parts.length ? 'exact' : 'parent',
        matched: at,
      };
    if (n === parts.length) {
      const under = data.entries.filter((e) => e.cr.some((c) => c.startsWith(at + '-')));
      if (under.length) return { kind: 'cr', cr, entries: under, via: 'under', matched: at };
    }
  }
  return null;
}

/** Whether a demo's rule id exists in a set of parsed entries (a CR number any entry cites, or an item id). */
export const ruleExists = (entries: readonly RuleEntry[], id: string): boolean =>
  entries.some((e) => e.id === id || e.cr.includes(id));

let loading: Promise<RulesData> | null = null;
/** The two files parsed once, in a lazy chunk. */
export function loadRules(): Promise<RulesData> {
  loading ??= import('./data.ts').then((m) => m.RULES);
  return loading;
}

// -----------------------------------------------------------------------------------------------
// Glossary links in a body of text
// -----------------------------------------------------------------------------------------------

/** Words so common that linking them would link every sentence. */
const TOO_COMMON = new Set(['type', 'field', 'hand', 'deck', 'cost', 'power', 'remove', 'damage']);

export type Piece = string | { term: string; text: string };

/**
 * `text` split into plain strings and glossary terms: the first mention of each term, at most `max`
 * of them, longest terms first. The caller links a term to `/rules?q=<term>`.
 */
export function linkTerms(text: string, glossary: readonly GlossaryTerm[], max = 4): Piece[] {
  const forms = [...new Set(glossary.flatMap((g) => termForms(g.term)))]
    .filter((f) => !TOO_COMMON.has(f.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  const found: { at: number; end: number; form: string }[] = [];
  for (const form of forms) {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      /^[[\w]/.test(form) ? String.raw`(?<![\w\[])${escaped}(?![\w\]])` : escaped,
      'i',
    );
    const m = re.exec(text);
    if (!m) continue;
    const at = m.index;
    const end = at + m[0].length;
    if (found.some((f) => at < f.end && end > f.at)) continue;
    found.push({ at, end, form });
  }
  const chosen = found.sort((a, b) => a.at - b.at).slice(0, max);
  const out: Piece[] = [];
  let pos = 0;
  for (const f of chosen) {
    if (f.at > pos) out.push(text.slice(pos, f.at));
    out.push({ term: f.form, text: text.slice(f.at, f.end) });
    pos = f.end;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

/** The entry a demo is about, as a route id: its first ruling, else its first rule (`item/80`, `cr/3-7-4`). */
export function demoEntryId(d: RuleDemo): string {
  if (d.rulings?.[0]) return d.rulings[0];
  const r = d.rules[0]!;
  return r.startsWith('item/') ? r : `cr/${r}`;
}

/** The demo a `/rules/<id>/show` route runs: a demo id, a rule or ruling it shows, or a CR number it shows. */
export function demoForId(
  data: RulesData,
  id: string,
  demos: readonly RuleDemo[] = DEMOS,
): RuleDemo | undefined {
  const direct = demos.find((d) => d.id === id);
  if (direct) return direct;
  const r = resolveRule(data, id);
  if (!r) return undefined;
  if (r.kind === 'entry') return demosFor(r.entry, demos)[0];
  return (
    demos.find((d) => d.rules.includes(r.cr) || d.rules.includes(r.matched)) ??
    r.entries.flatMap((e) => demosFor(e, demos))[0]
  );
}
