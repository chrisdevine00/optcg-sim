/**
 * M9 WP0: the paths of the learning layer, as data. `App.tsx` maps a `M9Page` to its lazy component;
 * `m9Route` is pure so a test walks every path. Rule ids may hold a slash (`cr/7-1-4-1`), so the
 * `/show` suffix is stripped first.
 */
export type M9Page =
  | 'meta'
  | 'meta-matchups'
  | 'meta-guide'
  | 'learn'
  | 'drills'
  | 'drill-start'
  | 'drill-run'
  | 'rules'
  | 'rules-entry'
  | 'rules-show'
  | 'progress';

export interface M9Match {
  page: M9Page;
  /** Full-screen like `/play`: no header or footer. */
  full: boolean;
}

const norm = (p: string) => p.replace(/\/+$/, '') || '/';

export function m9Route(rawPath: string): M9Match | null {
  const p = norm(rawPath);
  const seg = p.split('/').filter(Boolean);
  const [head, a, b] = seg;
  const some = (page: M9Page, full = false): M9Match => ({ page, full });
  switch (head) {
    case 'meta':
      if (seg.length === 1) return some('meta');
      if (seg.length === 2) return some(a === 'matchups' ? 'meta-matchups' : 'meta-guide');
      return null;
    case 'learn':
      return seg.length === 1 ? some('learn') : null; // `/learn/:id` is the existing lesson page
    case 'drills':
      if (seg.length === 1) return some('drills');
      if (seg.length === 2) return some('drill-start');
      if (seg.length === 3 && b === 'run') return some('drill-run', true);
      return null;
    case 'rules':
      if (seg.length === 1) return some('rules');
      if (seg[seg.length - 1] === 'show' && seg.length >= 3) return some('rules-show', true);
      return some('rules-entry');
    case 'progress':
      return seg.length === 1 ? some('progress') : null;
    default:
      return null;
  }
}

/** The id in `/rules/<id>` and `/rules/<id>/show`: `cr/7-1-4-1`, `RL-18`, `item/17`. */
export function ruleIdOf(rawPath: string): string {
  const seg = norm(rawPath).split('/').filter(Boolean).slice(1);
  if (seg[seg.length - 1] === 'show') seg.pop();
  return seg.map(decodeURIComponent).join('/');
}
