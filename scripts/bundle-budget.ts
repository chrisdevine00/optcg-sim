/**
 * Fails the build when the initial JavaScript exceeds the budget (PROMPT.md Performance: under 300 KB
 * gzipped, excluding the card JSON, which loads per set on demand). Initial = the entry chunk plus every
 * chunk it imports statically; lazy chunks (card sets, the card browser) are excluded.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET = 300 * 1024;
const dist = join(import.meta.dirname, '../app/dist');
type Entry = { file: string; isEntry?: boolean; imports?: string[]; css?: string[] };
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8')) as Record<
  string,
  Entry
>;

const entry = Object.entries(manifest).find(([k, v]) => v.isEntry && k.endsWith('index.html'));
if (!entry) throw new Error('No index.html entry in the Vite manifest');
const seen = new Set<string>();
const walk = (key: string) => {
  if (seen.has(key)) return;
  seen.add(key);
  for (const i of manifest[key]?.imports ?? []) walk(i);
};
walk(entry[0]);
const files = [...seen].map((k) => manifest[k]!.file).filter((f) => f.endsWith('.js'));
const sizes = files.map((f) => ({ f, gz: gzipSync(readFileSync(join(dist, f))).length }));
const total = sizes.reduce((n, s) => n + s.gz, 0);
const lazy = Object.values(manifest).filter(
  (v) => v.file.endsWith('.js') && !files.includes(v.file),
).length;
console.log(
  `Initial JS: ${(total / 1024).toFixed(1)} KB gzipped in ${files.length} file(s); ${lazy} lazy chunks excluded. Budget ${BUDGET / 1024} KB.`,
);
for (const s of sizes) console.log(`  ${s.f}: ${(s.gz / 1024).toFixed(1)} KB`);
if (total > BUDGET) {
  console.error('Initial JS is over budget.');
  process.exit(1);
}
