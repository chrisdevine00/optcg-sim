/**
 * `npm run meta:update [-- --days 90] [-- --refresh] [-- --write] [-- --report <file>]`
 *
 * PLAN §2a M6b-0, ADR 0014. Reads Limitless platform tournaments (`play.limitlesstcg.com/api`, no key
 * needed for tournament data; terms and robots.txt checked 2026-11-23, DECISIONS) for One Piece, and
 * writes a candidate `meta-lists.json`, a per-card play-frequency table and a report (the meta PR body).
 *
 * Without `--write` the candidate goes to `.cache/meta/out/`; with it, to `docs/research/meta-lists.json`
 * and `cards/data/play-frequency.json`. Responses are cached in `.cache/meta/`: standings of an event
 * more than 7 days old are never re-fetched, and the tournament list is re-fetched with `--refresh`.
 * Requests are at least 7 s apart (the API allows 50 per 5 minutes) and slow down further when the
 * rate-limit header says fewer than 5 remain.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPTED_IDS } from '../cards/effects/index.ts';
import {
  candidate,
  DEFAULTS,
  frequency,
  report,
  tally,
  type EventData,
  type LimitlessStanding,
  type LimitlessTournament,
  type MetaFile,
  type Options,
} from '../cards/scripts/meta.ts';
import { readSnapshot } from '../cards/scripts/update.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://play.limitlesstcg.com/api';
const UA = 'optcg-sim meta:update (+https://github.com/chrisdevine00/optcg-sim)';
const CACHE = join(ROOT, '.cache/meta');
const META = join(ROOT, 'docs/research/meta-lists.json');
const FREQ = join(ROOT, 'cards/data/play-frequency.json');
const MIN_GAP_MS = 7000;

const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const value = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let last = 0;
let gap = MIN_GAP_MS;

async function get<T>(path: string): Promise<T> {
  const wait = last + gap - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const url = `${API}${path}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    // `ratelimit: "50-in-5min"; r=49; t=300`
    const rl = /r=(\d+);\s*t=(\d+)/.exec(res.headers.get('ratelimit') ?? '');
    if (rl)
      gap = Number(rl[1]) < 5 ? (Number(rl[2]) * 1000) / Math.max(1, Number(rl[1])) : MIN_GAP_MS;
    if (res.status === 429 && attempt < 3) {
      const after = Number(res.headers.get('retry-after') ?? 60);
      console.error(`429 on ${path}; waiting ${after} s`);
      await sleep(after * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return (await res.json()) as T;
  }
}

function cached<T>(file: string, maxAgeDays: number | null): T | null {
  if (!existsSync(file)) return null;
  const { fetchedAt, body } = JSON.parse(readFileSync(file, 'utf8')) as {
    fetchedAt: string;
    body: T;
  };
  if (maxAgeDays !== null && Date.now() - Date.parse(fetchedAt) > maxAgeDays * 86_400_000)
    return null;
  return body;
}

function store(file: string, body: unknown) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ fetchedAt: new Date().toISOString(), body }));
}

async function tournaments(from: string, refresh: boolean): Promise<LimitlessTournament[]> {
  const out: LimitlessTournament[] = [];
  for (let page = 1; page < 200; page++) {
    const file = join(CACHE, `tournaments-${page}.json`);
    let body = refresh ? null : cached<LimitlessTournament[]>(file, 1);
    if (!body) {
      console.error(`fetch tournaments page ${page}`);
      body = await get<LimitlessTournament[]>(`/tournaments?game=OP&limit=50&page=${page}`);
      store(file, body);
    }
    out.push(...body);
    if (body.length < 50 || body.some((t) => t.date.slice(0, 10) < from)) break;
  }
  return out;
}

async function standings(t: LimitlessTournament): Promise<LimitlessStanding[]> {
  const file = join(CACHE, 'standings', `${t.id}.json`);
  const settled = Date.now() - Date.parse(t.date) > 7 * 86_400_000;
  const hit = cached<LimitlessStanding[]>(file, settled ? null : 1);
  if (hit) return hit;
  console.error(`fetch standings ${t.date.slice(0, 10)} ${t.name}`);
  const body = await get<LimitlessStanding[]>(`/tournaments/${t.id}/standings`);
  store(file, body);
  return body;
}

function guides(): Map<string, string> {
  const dir = join(ROOT, 'docs/content/archetypes');
  const out = new Map<string, string>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const asOf = /^asOf:\s*(\d{4}-\d{2}-\d{2})/m.exec(readFileSync(join(dir, f), 'utf8'))?.[1];
    if (asOf) out.set(f.replace(/\.md$/, ''), asOf);
  }
  return out;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const days = Number(value('--days') ?? 90);
  const from = new Date(Date.parse(today) - days * 86_400_000).toISOString().slice(0, 10);
  const opts: Options = { ...DEFAULTS, from, to: today };

  const snapshot = readSnapshot(join(ROOT, 'cards/data'));
  if (!snapshot) throw new Error('no card snapshot in cards/data; run npm run cards:update first');
  const lookup = (id: string) => snapshot.get(id);

  const list = (await tournaments(from, flag('--refresh'))).filter(
    (t) => t.date.slice(0, 10) >= from && t.players >= opts.minPlayers,
  );
  console.error(`${list.length} events of ${opts.minPlayers}+ players since ${from}`);
  const events: EventData[] = [];
  for (const t of list) events.push({ tournament: t, standings: await standings(t) });

  const knownSets = new Set([...snapshot.keys()].map((id) => id.split('-')[0]!));
  const t = tally(events, lookup, opts, knownSets);
  const current = JSON.parse(readFileSync(META, 'utf8')) as MetaFile;
  const cand = candidate(current, t, lookup, opts, today);
  const freq = frequency(t, opts, today, snapshot);
  const body = report({
    cand,
    t,
    guides: guides(),
    playbooks: new Set(
      readdirSync(join(ROOT, 'ai/playbooks'))
        .filter((f) => /^[A-Z]+\d*-\d{3}\.json$/.test(f))
        .map((f) => f.replace(/\.json$/, '')),
    ),
    scripted: new Set(SCRIPTED_IDS),
    lookup,
    today,
  });

  const write = flag('--write');
  const out = write ? null : join(CACHE, 'out');
  if (out) mkdirSync(out, { recursive: true });
  writeFileSync(
    out ? join(out, 'meta-lists.json') : META,
    JSON.stringify(cand.meta, null, 2) + '\n',
  );
  writeFileSync(
    out ? join(out, 'play-frequency.json') : FREQ,
    JSON.stringify(freq, null, 2) + '\n',
  );
  const reportFile = value('--report') ?? join(CACHE, 'report.md');
  mkdirSync(dirname(reportFile), { recursive: true });
  writeFileSync(reportFile, body);
  console.log(body);
  console.error(
    `candidate written to ${out ?? 'docs/research/meta-lists.json and cards/data/'}; report ${reportFile}`,
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
