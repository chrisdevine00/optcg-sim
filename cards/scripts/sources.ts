/**
 * Fetching for `cards:update`. optcgapi.com bulk endpoints (ADR 0007), cached in `.cache/cards/` and
 * re-fetched only with `--refresh`; the cache is seeded from Track B's raw responses when present.
 * A product optcgapi does not have yet comes from its Limitless card pages (ADR 0015), cached in
 * `.cache/cards/limitless/`, one request every 1.5 s.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { limitlessRow, limitlessSetIds, parseLimitless, type LimitlessCard } from './limitless.ts';
import type { RawRow } from './normalize.ts';

export const USER_AGENT = 'optcg-sim cards:update (+https://github.com/chrisdevine00/optcg-sim)';
export const API_BASE = 'https://optcgapi.com';
export const IMAGE_BASE = 'https://optcgapi.com/media/static/Card_Images/';
const DELAY_MS = 3000;

export type SourceFile = 'sets' | 'starters' | 'promos' | 'limitless';

export const ENDPOINTS: Record<Exclude<SourceFile, 'limitless'>, { url: string; seed: string }> = {
  sets: { url: `${API_BASE}/api/allSetCards/`, seed: 'optcgapi-allSetCards' },
  starters: { url: `${API_BASE}/api/allSTCards/`, seed: 'optcgapi-allSTCards' },
  // /api/allPromoCards/ returns 404 although documented; this filter returns every promo row.
  promos: { url: `${API_BASE}/api/promos/filtered/?set_id=P`, seed: 'optcgapi-promos-P' },
};

export interface CachedResponse {
  file: SourceFile;
  url: string;
  fetchedAt: string;
  rows: RawRow[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Three attempts, 30 s then 90 s apart: the weekly job should survive a slow or briefly down host. */
async function fetchWithRetry(
  url: string,
  log: (s: string) => void,
  accept = 'application/json',
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: accept } });
      if (res.ok || attempt === 3 || res.status < 500) return res;
      log(`${url}: HTTP ${res.status}, retrying`);
    } catch (e) {
      if (attempt === 3) throw e;
      log(`${url}: ${e instanceof Error ? e.message : String(e)}, retrying`);
    }
    await sleep(attempt === 1 ? 30_000 : 90_000);
  }
}

/** Loads each endpoint from the cache, seeding or fetching as needed. */
export async function loadSources(opts: {
  cacheDir: string;
  seedDir?: string;
  refresh: boolean;
  log: (s: string) => void;
}): Promise<CachedResponse[]> {
  mkdirSync(opts.cacheDir, { recursive: true });
  const out: CachedResponse[] = [];
  let fetched = 0;
  for (const [file, ep] of Object.entries(ENDPOINTS) as [
    keyof typeof ENDPOINTS,
    (typeof ENDPOINTS)[keyof typeof ENDPOINTS],
  ][]) {
    const body = join(opts.cacheDir, `${file}.json`);
    const meta = join(opts.cacheDir, `${file}.meta.json`);
    if (!opts.refresh && !existsSync(body) && opts.seedDir)
      seed(opts.seedDir, ep.seed, ep.url, body, meta, opts.log);
    if (opts.refresh || !existsSync(body)) {
      if (fetched++ > 0) await sleep(DELAY_MS);
      opts.log(`fetch ${ep.url}`);
      const res = await fetchWithRetry(ep.url, opts.log);
      if (!res.ok) throw new Error(`${ep.url}: HTTP ${res.status}`);
      const text = await res.text();
      JSON.parse(text); // fail before caching a bad body
      writeFileSync(body, text);
      writeFileSync(
        meta,
        JSON.stringify({ url: ep.url, fetchedAt: new Date().toISOString() }, null, 2),
      );
    }
    const m = JSON.parse(readFileSync(meta, 'utf8')) as { url: string; fetchedAt: string };
    const rows = JSON.parse(readFileSync(body, 'utf8')) as RawRow[];
    if (!Array.isArray(rows)) throw new Error(`${file}: expected an array`);
    out.push({ file, url: m.url, fetchedAt: m.fetchedAt, rows });
  }
  return out;
}

function seed(
  dir: string,
  name: string,
  url: string,
  body: string,
  meta: string,
  log: (s: string) => void,
) {
  const src = join(dir, `${name}.json`);
  if (!existsSync(src)) return;
  const hdr = join(dir, `${name}.hdr`);
  // The response Date header gives the fetch time; otherwise the file time.
  const date = existsSync(hdr)
    ? /^date:\s*(.+)$/im.exec(readFileSync(hdr, 'utf8'))?.[1]
    : undefined;
  const fetchedAt = new Date(date ?? statSync(src).mtime).toISOString();
  writeFileSync(body, readFileSync(src));
  writeFileSync(meta, JSON.stringify({ url, fetchedAt, seededFrom: src }, null, 2));
  log(`seeded ${name} from ${src} (fetched ${fetchedAt})`);
}

export const LIMITLESS_BASE = 'https://onepiece.limitlesstcg.com';
const LIMITLESS_DELAY_MS = 1500;

/**
 * Products read from Limitless because optcgapi.com does not have them (ADR 0015). A card optcgapi
 * has (a set or starter row with its number) always comes from optcgapi; its Limitless page is then a
 * cross-check whose differences `cards:update` reports. Remove a product once optcgapi has all of it
 * and the differences are settled.
 */
export const LIMITLESS_PRODUCTS: readonly { code: string; prefix: string; slug: string }[] = [
  { code: 'OP-18', prefix: 'OP18', slug: 'op18-the-dominance-of-god' },
];

export interface LimitlessSource {
  code: string;
  setUrl: string;
  /** Every card number on the set page, with its parsed page and when it was fetched. */
  cards: { id: string; url: string; fetchedAt: string; page: LimitlessCard; row: RawRow }[];
}

/** Loads each Limitless product's set page and card pages from the cache, fetching what is missing. */
export async function loadLimitless(opts: {
  cacheDir: string;
  refresh: boolean;
  log: (s: string) => void;
  products?: typeof LIMITLESS_PRODUCTS;
}): Promise<LimitlessSource[]> {
  const dir = join(opts.cacheDir, 'limitless');
  mkdirSync(dir, { recursive: true });
  const metaFile = join(dir, 'fetched.json');
  const fetchedAt: Record<string, string> = existsSync(metaFile)
    ? (JSON.parse(readFileSync(metaFile, 'utf8')) as Record<string, string>)
    : {};
  let first = true;
  const get = async (name: string, url: string): Promise<string> => {
    const file = join(dir, `${name}.html`);
    if (!opts.refresh && existsSync(file) && fetchedAt[name]) return readFileSync(file, 'utf8');
    if (!first) await sleep(LIMITLESS_DELAY_MS);
    first = false;
    opts.log(`fetch ${url}`);
    const res = await fetchWithRetry(url, opts.log, 'text/html');
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const text = await res.text();
    writeFileSync(file, text);
    fetchedAt[name] = new Date().toISOString();
    writeFileSync(metaFile, `${JSON.stringify(fetchedAt, null, 2)}\n`);
    return text;
  };
  const out: LimitlessSource[] = [];
  for (const p of opts.products ?? LIMITLESS_PRODUCTS) {
    const setUrl = `${LIMITLESS_BASE}/cards/${p.slug}`;
    const ids = limitlessSetIds(await get(p.slug, setUrl), p.prefix);
    if (ids.length === 0) throw new Error(`${setUrl}: no ${p.prefix} cards listed`);
    const cards: LimitlessSource['cards'] = [];
    for (const id of ids) {
      const url = limitlessCardUrl(id);
      const page = parseLimitless(await get(id, url));
      if (page.id !== id) throw new Error(`${url}: page is for ${page.id}`);
      cards.push({ id, url, fetchedAt: fetchedAt[id]!, page, row: limitlessRow(page, p.code) });
    }
    out.push({ code: p.code, setUrl, cards });
  }
  return out;
}

export const limitlessCardUrl = (id: string) => `${LIMITLESS_BASE}/cards/${id}`;

/** The per-card API page for a card number, used as `sourceUrl`. */
export function cardSourceUrl(id: string): string {
  const path = id.startsWith('P-') ? 'promos' : id.startsWith('ST') ? 'decks' : 'sets';
  return `${API_BASE}/api/${path}/card/${id}/`;
}
