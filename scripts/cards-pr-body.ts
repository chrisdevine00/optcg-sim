/**
 * `tsx scripts/cards-pr-body.ts <coverage-before.json>`: the body of the scheduled card-data PR
 * (`update.yml` job `cards`; ARCHITECTURE §3 "Update pipeline"). Reads the run's
 * `.cache/cards/report.json`, the new manifest and coverage report, and the format file.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoverageReport } from '../cards/scripts/measure.ts';
import type { DiffReport } from '../cards/scripts/diff.ts';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

const report = read<{ diff: DiffReport; warnings: string[] }>(
  join(ROOT, '.cache/cards/report.json'),
);
const manifest = read<{
  cardCount: number;
  newestSet: string;
  sets: { code: string; block: unknown }[];
}>(join(ROOT, 'cards/data/manifest.json'));
const fmt = read<{ regulation: { to: string } }>(join(ROOT, 'cards/format/standard.json'));
const after = read<CoverageReport>(join(ROOT, 'cards/data/coverage-report.json'));
const before = process.argv[2] ? read<CoverageReport>(process.argv[2]) : null;

const today = new Date().toISOString().slice(0, 10);
const days = Math.round((Date.parse(fmt.regulation.to) - Date.parse(today)) / 86_400_000);
const { diff } = report;
const list = (xs: string[], none = 'None.') => (xs.length ? xs.map((x) => `- ${x}`) : [none]);
const pct = (r: CoverageReport | null) =>
  r
    ? `${r.standard.overall.playingFully} of ${r.standard.overall.total} (${r.standard.overall.pct}%)`
    : 'n/a';

const lines = [
  `# Card data update ${today}`,
  '',
  `${manifest.cardCount} cards; newest booster ${manifest.newestSet}. Review before merging: nothing here reaches main unreviewed (ADR 0014).`,
  '',
  ...(days <= 60
    ? [
        `> **Rotation warning:** the Standard regulation ends ${fmt.regulation.to} (${days} days). Check the official announcement and update \`cards/format/standard.json\` by hand (ADR 0011).`,
        '',
      ]
    : []),
  '## Cards',
  '',
  `- New: ${diff.added.length}${diff.added.length ? ` (${diff.added.slice(0, 40).join(', ')}${diff.added.length > 40 ? ', …' : ''})` : ''}`,
  `- Removed: ${diff.removed.length}${diff.removed.length ? ` (${diff.removed.join(', ')})` : ''}`,
  `- Text changed (errata): ${diff.textChanged.length}`,
  `- Stats or types changed: ${diff.statsChanged.length}`,
  '',
  '## Scripted cards whose text changed (CI fails until each is re-verified)',
  '',
  ...list(diff.failures),
  '',
  '## Products with no cited block (legality `unknown` until a person adds one to `standard.json`)',
  '',
  ...list(manifest.sets.filter((s) => s.block === null).map((s) => s.code)),
  '',
  '## Standard coverage',
  '',
  `Before: ${pct(before)}. After: ${pct(after)}.`,
  '',
  `## Upstream warnings: ${report.warnings.length}`,
  '',
  'Full list in the workflow artifact `.cache/cards/report.json`.',
  '',
  'Next for a new set: `docs/runbooks/new-set.md` (cited block, audit, engine wave, scripting, tests, review).',
];
console.log(lines.join('\n'));
