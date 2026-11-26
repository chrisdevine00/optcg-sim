/**
 * Run by globalSetup.ts through tsx (the ai package imports JSON, which Playwright's loader does not
 * accept). Builds the planted games and the 300-decision fixture once, into
 * `.cache/m8wp7/`, for the review specs to load into the browser's IndexedDB. Nothing is committed:
 * the games are generated from the engine and the detectors' own test positions.
 *
 * The fixture takes about 20 s to play, so it is kept between runs and rebuilt only when the engine
 * or the card data change (a record is stale on another engine, and the app says so).
 */
import '../../test-setup/scripts.ts';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { replay } from '@optcg/engine';
import { makeFixture } from '../../scripts/review-fixture.ts';
import { lookup } from '../../ai/test/support.ts';
import { lastTurn, leaderOf, plantedGames } from './planted.ts';

const CACHE = '.cache/m8wp7';
const PLANTED_FILE = `${CACHE}/planted.json`;
const FIXTURE_FILE = `${CACHE}/fixture.json`;

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** What a fixture's validity depends on: the engine, the effect scripts and the card data. */
function inputsKey(): string {
  const h = createHash('sha1');
  for (const dir of ['engine/src', 'cards/effects', 'cards/data/sets'])
    for (const f of walk(dir).sort()) {
      const s = statSync(f);
      h.update(`${f}:${s.size}:${Math.round(s.mtimeMs)}`);
    }
  return h.digest('hex');
}

function main(): void {
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(PLANTED_FILE, JSON.stringify(plantedGames()));

  const key = inputsKey();
  if (existsSync(FIXTURE_FILE)) {
    try {
      if ((JSON.parse(readFileSync(FIXTURE_FILE, 'utf8')) as { key?: string }).key === key) return;
    } catch {
      /* rebuilt below */
    }
  }
  const f = makeFixture({ log: (l) => console.log(`[m8 fixture] ${l}`) });
  const end = replay(f.record, lookup).state;
  const game = {
    id: 'fixture-300',
    record: f.record,
    meta: {
      result: 'lost',
      me: 'p1',
      myLeader: leaderOf(end, 'p1'),
      opponentLeader: leaderOf(end, 'p2'),
      tier: 'rookie',
      deckName: 'Fixture',
      turns: lastTurn(f.record),
      endedAt: Date.UTC(2026, 10, 25, 11),
      tags: [],
      versions: f.record.versions,
    },
  };
  writeFileSync(FIXTURE_FILE, JSON.stringify({ key, decisions: f.decisions, game }));
}

main();
