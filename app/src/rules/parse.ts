/**
 * M9 WP5: the rules reference's two sources, parsed. `docs/research/rules-digest.md` (§Digest: 137
 * numbered, already-paraphrased items) and `docs/research/rulings.md` (RL entries with a question, an
 * answer, a confidence and sources). Pure text in, entries out; `index.ts` feeds it the raw files in a
 * lazy chunk. Counts are asserted in `app/test/rules-parse.test.ts`: a file that changes shape fails
 * loudly instead of quietly dropping entries.
 *
 * Two things never reach the screen: `[engine note]` clauses (our implementation notes, not rules) and
 * a ruling's `Engine test` paragraph.
 */
import type { RuleEntry } from './types.ts';

/** `7-1-4-1` from `7-1-4-1` or the CR's own typo form `8.6.3`. */
const dashed = (n: string): string => n.replace(/\.(?=\d)/g, '-').replace(/\.$/, '');

const NUM = String.raw`\d+(?:[-.]\d+)*`;
const CR_RUN = new RegExp(String.raw`\bCR (${NUM}(?:(?:, ?| and |\.\.)${NUM})*)`, 'g');
const ITEM_RUN = new RegExp(String.raw`\bitems? (\d+(?:(?:, | and )\d+)*)`, 'g');

/** `7-1-2-1..7-1-2-3` as `7-1-2-1, 7-1-2-2, 7-1-2-3` (same parent, a last number that counts up). */
function expandRange(from: string, to: string): string[] {
  const a = from.split('-');
  const b = to.split('-');
  if (a.length !== b.length) return [from, to];
  const last = Number(a[a.length - 1]);
  const end = Number(b[b.length - 1]);
  const head = a.slice(0, -1).join('-');
  if (head !== b.slice(0, -1).join('-') || !(end > last) || end - last > 12) return [from, to];
  const out: string[] = [];
  for (let n = last; n <= end; n++) out.push(head ? `${head}-${n}` : String(n));
  return out;
}

/**
 * Every rule cited in a text, as route ids' tails: CR numbers (`7-1-4-1`) and digest items
 * (`item/17`), in order of first mention, without repeats.
 */
export function citedRules(text: string): string[] {
  const out: string[] = [];
  const add = (x: string) => {
    if (!out.includes(x)) out.push(x);
  };
  for (const m of text.matchAll(CR_RUN)) {
    const run = m[1]!;
    const parts = run.split(/(,\s*| and |\.\.)/);
    let prevSep = '';
    let prev = '';
    for (const p of parts) {
      if (/^(,\s*| and |\.\.)$/.test(p)) {
        prevSep = p;
        continue;
      }
      const n = dashed(p);
      if (prevSep === '..' && prev) for (const x of expandRange(prev, n)) add(x);
      else add(n);
      prev = n;
      prevSep = '';
    }
  }
  for (const m of text.matchAll(ITEM_RUN))
    for (const n of m[1]!.split(/,\s*| and /)) add(`item/${Number(n)}`);
  return out;
}

/** Drops each `**[engine note]**` clause, which runs to the end of its line. */
export function stripEngineNotes(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/\s*\*\*\[engine note\]\*\*.*$/i, ''))
    .join('\n');
}

/** Markdown emphasis out, code ticks out; the text stays ours. */
const plain = (s: string): string =>
  s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .trim();

/** A short title for a digest item: its bold lead (`Attack Step`), else its first clause. */
function titleOf(raw: string): string {
  if (plain(raw) === '') return 'Implementation note';
  const lead = /^\*\*([^*]{2,60}?):?\*\*:?/.exec(raw);
  if (lead) return plain(lead[1]!).replace(/:$/, '');
  const first = plain(raw)
    .split(/(?<=[.:;])\s/)[0]!
    .replace(/\s*\(CR [^)]*\)\.?$/, '');
  const clipped = first.length > 70 ? first.slice(0, 67).replace(/\s+\S*$/, '') + '…' : first;
  return clipped.replace(/[.:;]$/, '');
}

export interface DigestItemRaw {
  n: number;
  section: string;
  raw: string;
}

/** The numbered items of §Digest with the section heading each sits under. */
export function digestItems(text: string): DigestItemRaw[] {
  const start = text.indexOf('\n## Digest');
  const stop = text.indexOf('\n## Corrections');
  if (start < 0 || stop < start)
    throw new Error('rules-digest.md: no "## Digest" … "## Corrections".');
  const body = text.slice(start, stop).split('\n');
  const items: DigestItemRaw[] = [];
  let section = '';
  let cur: DigestItemRaw | null = null;
  for (const line of body) {
    const h = /^###\s+(.+?)\s*$/.exec(line);
    if (h) {
      section = h[1]!;
      cur = null;
      continue;
    }
    const n = /^(\d+)\.\s+(.*)$/.exec(line);
    if (n) {
      cur = { n: Number(n[1]), section, raw: n[2]! };
      items.push(cur);
      continue;
    }
    // A continuation: an indented line belongs to the item above it.
    if (cur && /^\s+\S/.test(line)) cur.raw += '\n' + line.trim();
    else if (line.trim() === '' || /^---/.test(line)) cur = null;
  }
  return items;
}

export function parseDigest(text: string): RuleEntry[] {
  return digestItems(text).map(({ n, section, raw }) => {
    const clean = stripEngineNotes(raw);
    return {
      id: `item/${n}`,
      kind: 'digest' as const,
      section,
      title: titleOf(clean),
      text: plain(clean),
      cr: citedRules(clean),
      sources: [],
    };
  });
}

const CONFIDENCES = ['official explicit', 'official by inference', 'unresolved'] as const;

function confidenceOf(raw: string): {
  confidence: RuleEntry['confidence'];
  note: string | undefined;
} {
  const t = plain(raw).replace(/\.$/, '');
  const at = (c: string) => t.indexOf(c);
  const found = CONFIDENCES.map((c) => ({ c, i: at(c) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)[0];
  const confidence = found?.c;
  const note = confidence && t.length > confidence.length ? t : undefined;
  return { confidence, note };
}

/** The letter and name of a ruling family (`E. Battle`), or "Other rulings" past section I. */
function familyOf(heading: string): string {
  const m = /^([A-Z])\.\s/.exec(heading);
  return m && m[1]! <= 'I' ? heading : 'Other rulings';
}

export function parseRulings(text: string): RuleEntry[] {
  const lines = text.split('\n');
  const out: RuleEntry[] = [];
  let family = '';
  let i = 0;
  while (i < lines.length) {
    const fam = /^##\s+(.+?)\s*$/.exec(lines[i]!);
    if (fam) family = familyOf(fam[1]!);
    const h = /^###\s+(RL-\d+)\s+(.+?)\s*$/.exec(lines[i]!);
    if (!h) {
      i++;
      continue;
    }
    const id = h[1]!;
    const title = plain(h[2]!);
    // The block runs to the next heading or rule.
    let j = i + 1;
    while (j < lines.length && !/^(#{1,3}\s|---\s*$)/.test(lines[j]!)) j++;
    const fields = new Map<string, string>();
    let key: string | null = null;
    for (const line of lines.slice(i + 1, j)) {
      const f = /^- \*\*([^*]+?):\*\*\s*(.*)$/.exec(line);
      if (f) {
        key = f[1]!;
        fields.set(key, f[2]!);
      } else if (key && line.trim() !== '') fields.set(key, fields.get(key)! + '\n' + line);
    }
    const answer = stripEngineNotes(fields.get('Answer') ?? '');
    const sources = plain(fields.get('Sources') ?? '')
      .replace(/\.$/, '')
      .split(/;\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    const { confidence, note } = confidenceOf(fields.get('Confidence') ?? '');
    const entry: RuleEntry = {
      id,
      kind: 'ruling',
      section: family,
      title,
      text: plain(answer).replace(/^\n+/, ''),
      cr: citedRules(`${answer}\n${fields.get('Sources') ?? ''}`),
      sources,
    };
    const question = plain(fields.get('Question') ?? '');
    if (question) entry.question = question;
    if (confidence) entry.confidence = confidence;
    if (note) entry.confidenceNote = note;
    out.push(entry);
    i = j;
  }
  return out;
}
