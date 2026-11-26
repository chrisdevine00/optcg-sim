/**
 * The lessons (M8 WP6): `docs/content/curriculum.md`, bundled by Vite as raw text at build and
 * parsed here once, the way the tutorial's words are. Every `Explanation.lessonId` must be one of
 * these ids (a test fails on a lesson link with no page). The full Learn hub is M9; this is the
 * minimal page a flag's "Lesson:" link opens.
 */
import raw from '../../../docs/content/curriculum.md?raw';

export interface Lesson {
  /** `L10-counter-or-take` */
  id: string;
  /** `L10` */
  code: string;
  /** "Counter or take" */
  title: string;
  stage: string;
  /** Concept slugs and rules, as written. */
  slugs: string;
  rules: string;
  concept: string;
  drill: string;
  exit: string;
  exitTimed: string;
}

/** Drops Markdown emphasis and code ticks; keeps the source tags (`[SH-CTR]`) the page cites. */
export const plain = (s: string): string =>
  s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\*/g, '');

const field = (lines: string[], label: string): string => {
  const prefix = `- **${label}:**`;
  const l = lines.find((x) => x.startsWith(prefix));
  return l ? plain(l.slice(prefix.length).trim()) : '';
};

export function parseLessons(text: string): Lesson[] {
  const out: Lesson[] = [];
  let stage = '';
  let cur: { id: string; lines: string[] } | null = null;
  const done = () => {
    if (!cur) return;
    const m = /^(L\d+)-(.*)$/.exec(cur.id)!;
    const head = field(cur.lines, 'Concept slugs');
    const [slugs, rules] = head.split(' · Rules:').map((x) => x.trim()) as [
      string,
      string | undefined,
    ];
    const title = m[2]!.replace(/-/g, ' ');
    out.push({
      id: cur.id,
      code: m[1]!,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      stage,
      slugs: slugs ?? '',
      rules: rules ?? '',
      concept: field(cur.lines, 'Concept'),
      drill: field(cur.lines, 'Drill'),
      exit: field(cur.lines, 'Exit (untimed)'),
      exitTimed: field(cur.lines, 'Exit (optional, timed)'),
    });
    cur = null;
  };
  for (const line of text.split('\n')) {
    const st = /^## (Stage \d+ — .*)$/.exec(line);
    const ls = /^### (L\d+-[a-z0-9-]+)\s*$/.exec(line);
    if (st) {
      done();
      stage = st[1]!;
    } else if (ls) {
      done();
      cur = { id: ls[1]!, lines: [] };
    } else if (/^## /.test(line)) done();
    else if (cur) cur.lines.push(line);
  }
  done();
  return out;
}

export const LESSONS: readonly Lesson[] = parseLessons(raw);

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
