/**
 * The pure part of `check:bundle` (M10 WP2): per-route sizes from a Vite manifest. A route is a dynamic-import
 * entry of the app's entry chunk (a lazy page; the per-set card JSON is data, not a route). Its size is the gzip
 * of its own chunk plus every chunk it reaches through static imports that the initial bundle does not already
 * hold. A chunk shared by two routes counts in both (each route is measured as if opened first); a lazy chunk
 * another route loads later (a dynamic import) does not count; a cycle terminates.
 */
export type ManifestEntry = {
  file: string;
  name?: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
};
export type Manifest = Record<string, ManifestEntry>;

export type Part = { name: string; gz: number };
export type RouteSize = { key: string; route: string; gz: number; parts: Part[] };

/** Route names for the table; an entry not listed here prints under its file name minus "Route". */
export const ROUTE_LABELS: Record<string, string> = {
  'src/play/PlayRoute.tsx': 'Play',
  'src/cards/CardBrowser.tsx': 'Cards',
  'src/decks/DecksRoute.tsx': 'Decks',
  'src/tutorial/TutorialRoute.tsx': 'Tutorial',
  'src/settings/SettingsRoute.tsx': 'Settings',
  'src/play/review/ReviewsRoute.tsx': 'Reviews',
  'src/learn/LessonRoute.tsx': 'Lesson',
  'src/learn/LearnRoute.tsx': 'Learn',
  'src/about/AboutRoute.tsx': 'About',
  'src/meta/MetaRoute.tsx': 'Meta',
  'src/meta/MatchupGrid.tsx': 'Matchups',
  'src/meta/GuideRoute.tsx': 'Guide',
  'src/drills/DrillsHome.tsx': 'Drills home',
  'src/drills/DrillStart.tsx': 'Drill start',
  'src/drills/DrillRun.tsx': 'Drill run',
  'src/rules/RulesRoute.tsx': 'Rules',
  'src/rules/RuleEntry.tsx': 'Rule entry',
  'src/rules/ShowMe.tsx': 'Show me',
  'src/progress/ProgressRoute.tsx': 'Progress',
};

/** Static closure of a manifest key (the key included); terminates on cycles. */
export function staticClosure(manifest: Manifest, start: string): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const key = stack.pop()!;
    if (seen.has(key) || !manifest[key]) continue;
    seen.add(key);
    stack.push(...(manifest[key].imports ?? []));
  }
  return seen;
}

/** The app entry's lazy pages: its dynamic imports other than the per-set card JSON. */
export function routeEntries(manifest: Manifest): { entryKey: string; keys: string[] } {
  const entryKey = Object.keys(manifest).find(
    (k) => manifest[k]!.isEntry && k.endsWith('index.html'),
  );
  if (!entryKey) throw new Error('No index.html entry in the Vite manifest');
  const keys = (manifest[entryKey]!.dynamicImports ?? []).filter((k) => !k.endsWith('.json'));
  return { entryKey, keys };
}

const stem = (key: string) =>
  key
    .split('/')
    .pop()!
    .replace(/\.[a-z]+$/, '');
const label = (key: string) => ROUTE_LABELS[key] ?? (stem(key).replace(/Route$/, '') || key);

/** `sizeOf(file)` is the gzip size of a built file; only JS files count. Sorted smallest first. */
export function routeSizes(manifest: Manifest, sizeOf: (file: string) => number): RouteSize[] {
  const { entryKey, keys } = routeEntries(manifest);
  const initial = staticClosure(manifest, entryKey);
  return keys
    .map((key) => {
      const parts = [...staticClosure(manifest, key)]
        .filter((k) => !initial.has(k) && manifest[k]!.file.endsWith('.js'))
        .map((k) => ({ name: manifest[k]!.name ?? stem(k), gz: sizeOf(manifest[k]!.file) }))
        .sort((a, b) => b.gz - a.gz);
      return { key, route: label(key), gz: parts.reduce((n, p) => n + p.gz, 0), parts };
    })
    .sort((a, b) => a.gz - b.gz);
}

export const kb = (bytes: number) => (bytes / 1024).toFixed(1);

/** Routes over their cap, as messages; a route with no cap is never a failure. */
export function overCaps(sizes: RouteSize[], caps: Record<string, number>): string[] {
  return sizes.flatMap((s) => {
    const cap = caps[s.route];
    return cap !== undefined && s.gz > cap
      ? [`Route ${s.route}: ${kb(s.gz)} KB gz is over its cap of ${kb(cap)} KB.`]
      : [];
  });
}

/** "Route Play: 194.8 KB gz (Game 65.9 + engine 43.0 + ... + 3 smaller (9.1)), cap 215.0" */
export function describeRoute(s: RouteSize, cap?: number): string {
  const shown = s.parts.slice(0, 4).map((p) => `${p.name} ${kb(p.gz)}`);
  const rest = s.parts.slice(4);
  const tail =
    rest.length > 0 ? ` + ${rest.length} smaller (${kb(rest.reduce((n, p) => n + p.gz, 0))})` : '';
  return `Route ${s.route}: ${kb(s.gz)} KB gz (${shown.join(' + ')}${tail})${cap === undefined ? '' : `, cap ${kb(cap)}`}`;
}
