/**
 * Fetching for `cards:update`. Only optcgapi.com bulk endpoints (ADR 0007), cached in `.cache/cards/`
 * and re-fetched only with `--refresh`. The cache is seeded from Track B's raw responses when present.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RawRow } from './normalize.ts';

export const USER_AGENT = 'optcg-sim cards:update (+https://github.com/chrisdevine00/optcg-sim)';
export const API_BASE = 'https://optcgapi.com';
export const IMAGE_BASE = 'https://optcgapi.com/media/static/Card_Images/';
const DELAY_MS = 3000;

export type SourceFile = 'sets' | 'starters' | 'promos';

export const ENDPOINTS: Record<SourceFile, { url: string; seed: string }> = {
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
    SourceFile,
    (typeof ENDPOINTS)[SourceFile],
  ][]) {
    const body = join(opts.cacheDir, `${file}.json`);
    const meta = join(opts.cacheDir, `${file}.meta.json`);
    if (!opts.refresh && !existsSync(body) && opts.seedDir)
      seed(opts.seedDir, ep.seed, ep.url, body, meta, opts.log);
    if (opts.refresh || !existsSync(body)) {
      if (fetched++ > 0) await sleep(DELAY_MS);
      opts.log(`fetch ${ep.url}`);
      const res = await fetch(ep.url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
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

/** The per-card API page for a card number, used as `sourceUrl`. */
export function cardSourceUrl(id: string): string {
  const path = id.startsWith('P-') ? 'promos' : id.startsWith('ST') ? 'decks' : 'sets';
  return `${API_BASE}/api/${path}/card/${id}/`;
}
