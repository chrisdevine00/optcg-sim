/**
 * The tutorial's words. They live in `docs/content/tutorial.md` (front matter: title, sources, asOf,
 * confidence, PROMPT.md "Learning layer"), are bundled by Vite as raw text at build, and are parsed
 * here once. A step's copy (`TutorialStep.copy`) holds keys into this table; `fill` replaces a
 * `{name}` with a number read from the board when the words are shown, never a typed-in number.
 */
import raw from '../../../docs/content/tutorial.md?raw';

export interface ContentMeta {
  title: string;
  asOf: string;
  confidence: string;
  sources: string[];
}

export interface ParsedContent {
  meta: ContentMeta;
  /** `section.key` → text. */
  table: Record<string, string>;
}

/** Parse the Markdown: `---` front matter, then `## id` sections of `- key: text` lines. */
export function parseContent(text: string): ParsedContent {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!m) throw new Error('tutorial.md has no front matter.');
  const meta: ContentMeta = { title: '', asOf: '', confidence: '', sources: [] };
  let list = false;
  for (const line of m[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) {
      const [, k, v] = kv;
      list = k === 'sources';
      const val = v!.replace(/^"(.*)"$/, '$1');
      if (k === 'title') meta.title = val;
      else if (k === 'asOf') meta.asOf = val;
      else if (k === 'confidence') meta.confidence = val;
    } else {
      const item = /^\s+-\s+(.*)$/.exec(line);
      if (list && item) meta.sources.push(item[1]!.trim());
    }
  }
  const table: Record<string, string> = {};
  let section = '';
  for (const line of m[2]!.split('\n')) {
    const h = /^##\s+(\S+)\s*$/.exec(line);
    if (h) {
      section = h[1]!;
      continue;
    }
    const b = /^-\s+([\w.]+):\s+(.*\S)\s*$/.exec(line);
    if (b && section) table[`${section}.${b[1]}`] = b[2]!;
  }
  return { meta, table };
}

const parsed = parseContent(raw);
export const CONTENT_META = parsed.meta;
export const COPY: Readonly<Record<string, string>> = parsed.table;

/** Bumps when the words or the scenarios change; the timing log records it (usability-plan §7.1). */
export const TUTORIAL_VERSION = `1+${CONTENT_META.asOf}`;

/** The words for a copy key; a missing key is a bug the content test catches, shown as itself. */
export function say(key: string, vars: Readonly<Record<string, string | number>> = {}): string {
  const t = COPY[key];
  if (t === undefined) return key;
  return t.replace(/\{(\w+)\}/g, (_m, name: string) =>
    vars[name] === undefined ? '…' : String(vars[name]),
  );
}

/** Every `{name}` a text uses. */
export const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
