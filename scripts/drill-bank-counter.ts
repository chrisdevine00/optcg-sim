/**
 * Generates the counter-or-take bank (M9 WP3): `npx tsx scripts/drill-bank-counter.ts [--check]`.
 *
 * Seeds 1, 2, 3 ... each build one defence position from the sourced lists; a position is admitted when
 * the M8 detectors' own checks classify it `any-hand` (`counterBank`). Writes
 * `app/src/drills/banks/counter.json` (card ids only, no art); `--check` regenerates and compares with
 * the committed file instead (byte-identical or exit 1). Nodes and seeds only: no clock, no randomness.
 */
import '../test-setup/scripts.ts';
import { readFileSync, writeFileSync } from 'node:fs';
import { ENGINE_VERSION } from '@optcg/engine';
import { counterBank } from '../ai/src/search/drills/counter.ts';
import { metaListSets } from '../ai/src/search/drills/mulligan.ts';
import { DRILL_SCRIPTS_VERSION } from '../ai/src/search/drills/positions.ts';
import type { DrillBank } from '../ai/src/search/drills/types.ts';
import { cardMap } from '../ai/test/support.ts';
import { format, resolveConfig } from 'prettier';

const file = new URL('../app/src/drills/banks/counter.json', import.meta.url);

export async function generate(log: (s: string) => void = () => {}): Promise<string> {
  const items = counterBank(metaListSets(), cardMap(), {
    onItem: (i) => log(`  ${i.id} ${i.detector} (${i.mine} v ${i.theirs})`),
  });
  const bank: DrillBank = {
    drill: 'counter',
    builtWith: { engine: ENGINE_VERSION, scripts: DRILL_SCRIPTS_VERSION },
    items,
  };
  const config = (await resolveConfig(file.pathname)) ?? {};
  return format(JSON.stringify(bank), { ...config, parser: 'json' });
}

const text = await generate((s) => console.error(s));
if (process.argv.includes('--check')) {
  const same = readFileSync(file, 'utf8') === text;
  console.error(same ? 'counter.json is up to date' : 'counter.json differs from a fresh run');
  process.exit(same ? 0 : 1);
}
writeFileSync(file, text);
console.error(`wrote ${file.pathname}`);
