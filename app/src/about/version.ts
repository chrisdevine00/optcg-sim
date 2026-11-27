/**
 * M10 WP6: what this build is, read from `version.json` at run time (the build writes it beside the
 * app; ARCHITECTURE §5 "App updates"). One lazy fetch (a successful answer is cached for the page's life, a failed one is not: M10-R12), shared by the About
 * page and the error page's "Copy details". It never rejects: no file (dev server, offline) is null.
 */
export interface VersionInfo {
  release: string;
  build: string;
  /** The commit the build was made from (M10-R1); empty for a build that could not say. */
  commit: string;
  builtAt: string;
  cardsThrough: string;
  cardCount: number;
  metaAsOf: string;
  engine: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** The fields of a `version.json`, or null when it is not one (a hand-edited or HTML 404 body). */
export function parseVersion(json: unknown): VersionInfo | null {
  if (typeof json !== 'object' || json === null) return null;
  const o = json as Record<string, unknown>;
  if (typeof o.build !== 'string') return null;
  return {
    release: str(o.release),
    build: o.build,
    commit: str(o.commit),
    builtAt: str(o.builtAt),
    cardsThrough: str(o.cardsThrough),
    cardCount: typeof o.cardCount === 'number' ? o.cardCount : 0,
    metaAsOf: str(o.metaAsOf),
    engine: str(o.engine),
  };
}

let cached: Promise<VersionInfo | null> | null = null;

/** Fetches `<base>version.json` once; `fetcher` and `base` are parameters so a test passes its own. */
export function loadVersion(
  // The one same-origin fetch outside art/: the build's own version.json (nothing leaves the browser).
  // eslint-disable-next-line no-restricted-globals
  fetcher: typeof fetch = (...a) => fetch(...a),
  base: string = import.meta.env.BASE_URL,
): Promise<VersionInfo | null> {
  if (cached) return cached;
  const p: Promise<VersionInfo | null> = fetcher(`${base}version.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then(parseVersion)
    .catch(() => null)
    .then((v) => {
      // M10-R12: only a version is remembered. A failed load (offline, a 404 body) is forgotten, so the
      // next call after the connection is back asks again instead of repeating the old failure.
      if (v === null && cached === p) cached = null;
      return v;
    });
  cached = p;
  return p;
}

/** Forget the cached answer (tests; and a page that wants to retry after coming back online). */
export function resetVersionCache(): void {
  cached = null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "27 Nov 2026" from an ISO timestamp or date, in UTC; the input itself when it is not a date. */
export function dayWords(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}
