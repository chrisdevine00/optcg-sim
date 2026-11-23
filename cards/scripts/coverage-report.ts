/**
 * `npm run cards:report`: print Standard coverage, overall and per set, from `cards/data/coverage-report.json`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoverageReport, Tally } from './measure.ts';

const path = join(dirname(fileURLToPath(import.meta.url)), '../data/coverage-report.json');

export function formatTable(r: CoverageReport): string {
  const row = (label: string, t: Tally) =>
    `${label.padEnd(10)}${String(t.total).padStart(6)}${String(t.scripted).padStart(9)}${String(t.vanilla + t.keywords).padStart(9)}${String(t.unscripted).padStart(11)}${t.pct.toFixed(1).padStart(8)}%`;
  const lines = [
    `Standard coverage as of ${r.asOf} (weights: ${r.weightSource})`,
    `${''.padEnd(10)}${'cards'.padStart(6)}${'scripted'.padStart(9)}${'vanilla'.padStart(9)}${'unscripted'.padStart(11)}${'playing'.padStart(9)}`,
    row('overall', r.standard.overall),
    ...Object.entries(r.standard.byBlock).map(([b, t]) => row(`block ${b}`, t)),
    '',
    ...Object.entries(r.standard.bySet).map(([s, t]) => row(s, t)),
    '',
    `Unknown legality (not counted): ${r.standard.unknown.count} cards`,
    `Clause tag rate: ${r.tagger.clauseTagRate}% (${r.tagger.clausesTagged} of ${r.tagger.clauses})`,
  ];
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(formatTable(JSON.parse(readFileSync(path, 'utf8')) as CoverageReport));
}
