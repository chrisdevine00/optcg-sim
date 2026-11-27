/**
 * M9 WP1: the archetype guides, parsed from `docs/content/archetypes/*.md` (bundled as raw text in a
 * lazy chunk) and `docs/content/sources.md`. The parsers are pure (text in, data out) so a test can
 * edit a guide and parse it again. Inline `[TAG]` resolve through `sources.md`, `*(inference)*`
 * becomes the "our reasoning" mark, and the Matchups table becomes one `GuideMatchup` per opponent.
 */
import raw from '../../../docs/content/sources.md?raw';
import type { Guide, GuideBlock, GuideList, GuideMatchup, GuideSection, Span } from './types.ts';

/** One row of `sources.md`: what a `[TAG]` stands for. */
export interface Source {
  tag: string;
  label: string;
  url: string | null;
}

/** Source tags are upper-case words: `CARD`, `ML`, `SH-XEB`, `TCGP-DAL`. Card text brackets (`[Trigger]`) are not. */
const TAG = /^(?:[A-Z]{2,}(?:-[A-Z0-9]+)*|CR \d[\d-]*)$/;
export const isTag = (s: string): boolean => TAG.test(s);

/** Drops Markdown emphasis and code ticks (as `lessons.ts` does). */
const plain = (s: string): string => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\*/g, '');

/** `sources.md` rows: `| [TAG] | Source — URL | date | used for |`. Pure. */
export function parseSources(text: string): Map<string, Source> {
  const out = new Map<string, Source>();
  for (const line of text.split('\n')) {
    const m = /^\|\s*\[([^\]]+)\]\s*\|\s*(.*?)\s*\|/.exec(line);
    if (!m) continue;
    const tag = m[1]!;
    const cell = m[2]!;
    const url = /https?:\/\/[^\s)|]+/.exec(cell)?.[0] ?? null;
    const label = plain(
      cell
        .replace(/\s*—?\s*https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    out.set(tag, { tag, label: label || tag, url });
  }
  return out;
}

/** Every tag `sources.md` defines (a `CR 6-4-1` resolves through the `CR x-y-z` row). */
export const SOURCES: ReadonlyMap<string, Source> = parseSources(raw);

export function resolveTag(tag: string, sources: ReadonlyMap<string, Source> = SOURCES): Source {
  const hit = sources.get(tag);
  if (hit) return hit;
  if (/^CR \d/.test(tag)) {
    const cr = sources.get('CR x-y-z');
    if (cr) return { tag, label: `Comprehensive Rules ${tag.slice(3)}`, url: cr.url };
  }
  return { tag, label: tag, url: null };
}

/** Whether a tag resolves in `sources.md` (the parse test's check). */
export const knownTag = (tag: string, sources: ReadonlyMap<string, Source> = SOURCES): boolean =>
  sources.has(tag) || (/^CR \d/.test(tag) && sources.has('CR x-y-z'));

/** Inline text to spans: `[TAG]`, `*(inference …)*`, links reduced to their words, emphasis dropped. */
export function parseSpans(text: string, sources: ReadonlyMap<string, Source> = SOURCES): Span[] {
  const out: Span[] = [];
  const pushText = (t: string) => {
    const s = plain(t.replace(/\[([^\]]+)\]\(https?:[^)]*\)/g, '$1'));
    if (s === '') return;
    const last = out[out.length - 1];
    if (last?.kind === 'text') last.text += s;
    else out.push({ kind: 'text', text: s });
  };
  // Inference marks first: they may hold a `[TAG]` of their own.
  const parts = text.split(/(\*\(inference[^*]*\)\*)/);
  for (const part of parts) {
    const inf = /^\*\(inference\s*([^*]*)\)\*$/.exec(part);
    if (inf) {
      const note = inf[1]!.trim();
      out.push(note ? { kind: 'inference', note } : { kind: 'inference' });
      continue;
    }
    for (const bit of part.split(/(\[[^\]\n]+\](?!\())/)) {
      const t = /^\[([^\]]+)\]$/.exec(bit);
      if (t && isTag(t[1]!)) {
        const s = resolveTag(t[1]!, sources);
        out.push({ kind: 'source', tag: s.tag, label: s.label, url: s.url });
      } else pushText(bit);
    }
  }
  return out;
}

/** The `[TAG]`s in a run of text, in order, resolved or not. */
export const tagsIn = (text: string): string[] =>
  [...text.matchAll(/\[([^\]\n]+)\](?!\()/g)].map((m) => m[1]!).filter(isTag);

/** The words of a span run, for names and tests (a source reads as its tag, an inference mark as nothing). */
export const spansText = (spans: readonly Span[]): string =>
  spans
    .map((s) => (s.kind === 'text' ? s.text : s.kind === 'source' ? `[${s.tag}]` : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

// ---- front matter ----

interface Front {
  title: string;
  leaderId: string;
  archetypeId: string;
  colors: string[];
  asOf: string;
  confidence: string;
  sources: string[];
}

function parseFront(text: string): { front: Front; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) throw new Error('guide has no front matter');
  const kv: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  let key: string | null = null;
  for (const line of m[1]!.split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && key) {
      (lists[key] ??= []).push(item[1]!.trim());
      continue;
    }
    const f = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (f) {
      key = f[1]!;
      kv[key] = f[2]!.trim();
    }
  }
  const unquote = (s: string) => s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  const arr = (s: string | undefined) =>
    (s ?? '')
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  const need = (k: string) => {
    const v = kv[k];
    if (v === undefined || v === '') throw new Error(`guide front matter lacks ${k}`);
    return unquote(v);
  };
  return {
    front: {
      title: need('title'),
      leaderId: need('leaderId'),
      archetypeId: need('archetypeId'),
      colors: arr(kv.colors),
      asOf: need('asOf'),
      confidence: need('confidence'),
      sources: lists.sources ?? [],
    },
    body: text.slice(m[0].length),
  };
}

// ---- blocks ----

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

const isSep = (line: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

type Raw =
  | { kind: 'p'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

function rawBlocks(lines: string[]): Raw[] {
  const out: Raw[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === '') {
      i++;
    } else if (line.startsWith('|') && i + 1 < lines.length && isSep(lines[i + 1]!)) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i]!.startsWith('|')) rows.push(cells(lines[i++]!));
      out.push({ kind: 'table', head, rows });
    } else if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i]!;
        const it = /^(?:[-*]|\d+\.)\s+(.*)$/.exec(l);
        if (it) {
          items.push(it[1]!);
          i++;
        } else if (/^\s+\S/.test(l) && items.length > 0) {
          items[items.length - 1] += ' ' + l.trim();
          i++;
        } else break;
      }
      out.push({ kind: 'list', ordered, items });
    } else {
      const buf: string[] = [];
      while (
        i < lines.length &&
        lines[i]!.trim() !== '' &&
        !lines[i]!.startsWith('|') &&
        !/^(?:[-*]|\d+\.)\s+/.test(lines[i]!) &&
        // A line that opens with a bold label ("**Leader:**") is its own paragraph.
        !(buf.length > 0 && lines[i]!.startsWith('**'))
      )
        buf.push(lines[i++]!.trim());
      out.push({ kind: 'p', text: buf.join(' ') });
    }
  }
  return out;
}

const slug = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** "11-12 (even) [SH-XEB]": the first W-L pair and the parenthesis after it. */
function parseRecord(
  cell: string,
  owner: string,
): { record: GuideMatchup['record']; owner: string | null; recordCell: string } {
  const recordCell = plain(cell.replace(/\s*\[[^\]\n]+\](?!\()/g, ''))
    .replace(/\s+/g, ' ')
    .replace(/\s+([;,.])/g, '$1')
    .trim();
  const first = recordCell.split(/;(?![^(]*\))/)[0]!;
  const wl = /^\s*(\d+)\s*[-–]\s*(\d+)/.exec(first);
  if (!wl) return { record: null, owner: null, recordCell };
  const paren = /\(([^)]*)\)/.exec(first)?.[1]?.trim() ?? '';
  return {
    record: { w: Number(wl[1]), l: Number(wl[2]), text: paren },
    owner,
    recordCell,
  };
}

function parseMatchups(t: Extract<Raw, { kind: 'table' }>, owner: string, src: SourceMap) {
  const out: GuideMatchup[] = [];
  for (const row of t.rows) {
    const opp = /^([A-Z]{1,3}\d{2}-\d{3})\b/.exec(row[0] ?? '')?.[1];
    if (!opp) continue;
    const planText = row[2] ?? '';
    const rec = parseRecord(row[1] ?? '', owner);
    const plan = parseSpans(planText, src);
    out.push({
      opponent: opp,
      record: rec.record,
      owner: rec.owner,
      recordCell: rec.recordCell,
      recordSpans: parseSpans(row[1] ?? '', src),
      plan,
      tags: [...tagsIn(row[1] ?? ''), ...tagsIn(planText)],
      inference: plan.some((s) => s.kind === 'inference'),
    });
  }
  return out;
}

type SourceMap = ReadonlyMap<string, Source>;

function parseLists(t: Extract<Raw, { kind: 'table' }>): GuideList[] {
  return t.rows.map((r) => {
    const players = Number(r[2]);
    return {
      event: plain(r[0] ?? ''),
      date: (r[1] ?? '').trim(),
      players: Number.isFinite(players) && (r[2] ?? '') !== '' ? players : null,
      placing: plain(r[3] ?? ''),
      record: plain(r[4] ?? ''),
      player: plain(r[5] ?? ''),
      url: /\]\((https?:[^)]+)\)/.exec(r[6] ?? '')?.[1] ?? null,
    };
  });
}

/** One guide file to a `Guide`. Throws on a file without the front matter the page needs. */
export function parseGuide(text: string, sources: SourceMap = SOURCES): Guide {
  const { front, body } = parseFront(text);
  const lines = body.split('\n');
  // Split at "## " headings; what precedes the first is the overview.
  const chunks: { heading: string; lines: string[] }[] = [{ heading: 'Overview', lines: [] }];
  for (const l of lines) {
    const h = /^## (.*)$/.exec(l);
    if (h) chunks.push({ heading: plain(h[1]!).trim(), lines: [] });
    else if (!/^# /.test(l) || chunks.length > 1) chunks[chunks.length - 1]!.lines.push(l);
  }
  const sections: GuideSection[] = [];
  let matchups: GuideMatchup[] = [];
  let lists: GuideList[] = [];
  let playbook: Span[][] = [];
  for (const c of chunks) {
    const id = slug(c.heading);
    const raws = rawBlocks(c.lines);
    const blocks: GuideBlock[] = [];
    for (const r of raws) {
      if (r.kind === 'table' && id === 'matchups')
        matchups = parseMatchups(r, front.leaderId, sources);
      else if (r.kind === 'table' && id === 'sourced-lists') lists = parseLists(r);
      else if (r.kind === 'list' && id === 'playbook-seeds' && r.ordered)
        playbook = r.items.map((x) => parseSpans(x, sources));
      else if (r.kind === 'p') blocks.push({ kind: 'p', spans: parseSpans(r.text, sources) });
      else if (r.kind === 'list')
        blocks.push({
          kind: 'list',
          ordered: r.ordered,
          items: r.items.map((x) => parseSpans(x, sources)),
        });
      else
        blocks.push({
          kind: 'table',
          head: r.head.map(plain),
          rows: r.rows.map((row) => row.map((cell) => parseSpans(cell, sources))),
        });
    }
    if (c.heading === 'Overview' && blocks.length === 0) continue;
    sections.push({ id, heading: c.heading, blocks });
  }
  return { ...front, sections, matchups, lists, playbook };
}

// ---- loading ----

const RAW = import.meta.glob('../../../docs/content/archetypes/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

let cache: Promise<Guide[]> | null = null;

/** Every guide, in file-name order, parsed once. */
export function loadGuides(): Promise<Guide[]> {
  cache ??= Promise.all(
    Object.keys(RAW)
      .sort()
      .map(async (k) => parseGuide(await RAW[k]!())),
  );
  return cache;
}

/** Card numbers named in a table's first column: the "Defining cards" chips. */
export function cardIdsIn(spans: readonly Span[][]): string[] {
  const ids: string[] = [];
  for (const cell of spans) {
    const m = /\b([A-Z]{1,3}\d{2}-\d{3})\b/.exec(spansText(cell));
    if (m && !ids.includes(m[1]!)) ids.push(m[1]!);
  }
  return ids;
}
