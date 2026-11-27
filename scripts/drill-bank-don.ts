/**
 * Generates the DON!! allocation bank (M9 WP3): `npx tsx scripts/drill-bank-don.ts [--check]`.
 *
 * Seeds 1, 2, 3 ... each build one Main phase from the sourced lists with three or four described
 * lines; a position is admitted when the lines' least-unused DON!! count is unique (`donBank`: 12
 * ordinary items and 6 `hold` items built for the OP13-001 guide). Writes
 * `app/src/drills/banks/don.json` (card ids only); `--check` regenerates and compares with the
 * committed file instead (byte-identical or exit 1). Seeds only: no clock, no randomness.
 */
import '../test-setup/scripts.ts';
import { readFileSync, writeFileSync } from 'node:fs';
import { ENGINE_VERSION } from '@optcg/engine';
import { donBank } from '../ai/src/search/drills/don.ts';
import { metaListSets } from '../ai/src/search/drills/mulligan.ts';
import { DRILL_SCRIPTS_VERSION } from '../ai/src/search/drills/positions.ts';
import type { DrillBank } from '../ai/src/search/drills/types.ts';
import { cardMap } from '../ai/test/support.ts';
import { format, resolveConfig } from 'prettier';

const file = new URL('../app/src/drills/banks/don.json', import.meta.url);

export async function generate(log: (s: string) => void = () => {}): Promise<string> {
  const items = donBank(metaListSets(), cardMap(), {
    onItem: (i) => log(`  ${i.id} ${i.hold ? 'hold' : 'ordinary'} (${i.mine} v ${i.theirs})`),
  });
  const bank: DrillBank = {
    drill: 'don',
    builtWith: { engine: ENGINE_VERSION, scripts: DRILL_SCRIPTS_VERSION },
    items,
  };
  const config = (await resolveConfig(file.pathname)) ?? {};
  return format(JSON.stringify(bank), { ...config, parser: 'json' });
}

const text = await generate((s) => console.error(s));
if (process.argv.includes('--check')) {
  const same = readFileSync(file, 'utf8') === text;
  console.error(same ? 'don.json is up to date' : 'don.json differs from a fresh run');
  process.exit(same ? 0 : 1);
}
writeFileSync(file, text);
console.error(`wrote ${file.pathname}`);
