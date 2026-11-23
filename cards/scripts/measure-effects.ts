/**
 * `npm run cards:measure`
 *
 * Tags every card's effect and trigger text with the effect tagger (effect-dsl E-D10) and writes the pool
 * backlog and primitive gap list to `cards/data/coverage-report.json`. Pure measurement: it reads
 * `cards/data/`, never fetches, and never produces scripts (ADR 0006). The output is deterministic, so a
 * rerun on unchanged data is byte-identical; `cards/test/measure.test.ts` fails when the committed file is stale.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Manifest } from '../src/schema.ts';
import { SCRIPTED_IDS } from '../effects/index.ts';
import { readSnapshot } from './update.ts';
import {
  formatReport,
  loadWeights,
  measure,
  type MetaListsFile,
  type PlayFrequencyFile,
} from './measure.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const REPORT_PATH = join(ROOT, 'cards/data/coverage-report.json');

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : null;
}

/** Build the report text from the committed data, scripts and weights. */
export function generateReport(root: string = ROOT): string {
  const data = join(root, 'cards/data');
  const cards = readSnapshot(data);
  if (!cards) throw new Error('cards/data/sets is missing; run `npm run cards:update` first');
  const manifest = readJson<Manifest>(join(data, 'manifest.json'));
  if (!manifest) throw new Error('cards/data/manifest.json is missing');
  const { weights, source } = loadWeights(
    readJson<PlayFrequencyFile>(join(data, 'play-frequency.json')),
    readJson<MetaListsFile>(join(root, 'docs/research/meta-lists.json')),
  );
  return formatReport(
    measure({
      cards: [...cards.values()].sort((a, b) => (a.id < b.id ? -1 : 1)),
      scripted: SCRIPTED_IDS,
      weights,
      weightSource: source,
      asOf: manifest.fetchedAt,
    }),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(REPORT_PATH, generateReport());
  console.log(`Wrote ${REPORT_PATH}`);
}
