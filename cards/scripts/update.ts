/**
 * `npm run cards:update [-- --refresh] [-- --dry-run]`
 *
 * Fetches optcgapi.com bulk endpoints (cached in .cache/cards/), normalizes every defect class, applies
 * cards/overrides/, computes block and legality from cards/format/standard.json, validates every record,
 * writes cards/data/, and prints a diff against the previous snapshot. Fails on: an ambiguous or
 * unmatched type split, a card with no usable row, a stale override, an invalid record, or changed text
 * on a card that has an effect script.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Card, Manifest, SetFile, SetSummary } from '../src/schema.ts';
import { blockOf, extraLegality, standardLegality, type StandardFormat } from '../src/format.ts';
import { validateCard } from '../src/validate.ts';
import { assemble, type Issue, type SourcedRow } from './build.ts';
import { rowProblems } from './normalize.ts';
import { diffSnapshots, formatDiff, loadScriptIndex } from './diff.ts';
import { applyOverride, loadOverrides } from './overrides.ts';
import { API_BASE, loadSources } from './sources.ts';
import { TypeVocabulary } from './types-vocab.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CARDS = join(ROOT, 'cards');
const DATA = join(CARDS, 'data');

export function readSnapshot(dataDir: string): Map<string, Card> | null {
  const dir = join(dataDir, 'sets');
  if (!existsSync(dir)) return null;
  const out = new Map<string, Card>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const s = JSON.parse(readFileSync(join(dir, f), 'utf8')) as SetFile;
    for (const c of s.cards) out.set(c.id, c);
  }
  return out;
}

const KIND: Record<string, SetSummary['kind']> = {
  OP: 'booster',
  ST: 'starter',
  EB: 'extra',
  PRB: 'premium',
  P: 'promo',
};

/** Sort key so OP-17 is newer than OP-09, and boosters order before starters. */
export function setOrder(code: string): number {
  const m = /^([A-Z]+)-?(\d*)$/.exec(code)!;
  const kinds = ['OP', 'EB', 'PRB', 'ST', 'P'];
  return kinds.indexOf(m[1]!) * 1000 + Number(m[2] || 0);
}

export interface PipelineResult {
  cards: Map<string, Card>;
  fatals: string[];
  warnings: string[];
  summary: Record<string, number>;
  setNames: Map<string, string>;
  fetched: string[];
  printingCount: number;
  fmt: StandardFormat;
  vocab: TypeVocabulary;
  issues: Issue[];
}

/** Everything except writing: fetch or read the cache, normalize, override, format, validate. */
export async function pipeline(opts: {
  refresh: boolean;
  log: (s: string) => void;
  skipOverrides?: Set<string>;
}): Promise<PipelineResult> {
  const { log } = opts;
  const sources = await loadSources({
    cacheDir: join(ROOT, '.cache/cards'),
    seedDir: join(ROOT, '.cache/track-b/raw'),
    refresh: opts.refresh,
    log,
  });
  const rows: SourcedRow[] = sources.flatMap((s) =>
    s.rows.map((r) => ({ ...r, file: s.file, fetchedAt: s.fetchedAt })),
  );
  log(`${rows.length} upstream rows from ${sources.map((s) => s.url).join(', ')}`);

  // Vocabulary from rows whose columns are not shifted.
  const vocab = new TypeVocabulary(
    rows
      .filter((r) => rowProblems(r).length === 0)
      .map((r) => r.sub_types ?? '')
      .filter(Boolean),
  );
  const asm = assemble(rows, vocab);
  const fmt = JSON.parse(
    readFileSync(join(CARDS, 'format/standard.json'), 'utf8'),
  ) as StandardFormat;
  const overrides = loadOverrides(join(CARDS, 'overrides'));

  const fatals: string[] = [];
  const warnings: string[] = [];
  const overrideCount: Record<string, number> = {};
  const count = (k: string) => (overrideCount[k] = (overrideCount[k] ?? 0) + 1);
  for (const [id, o] of overrides) {
    if (opts.skipOverrides?.has(id)) continue;
    const card = asm.cards.get(id);
    if (!card) {
      fatals.push(`${id}: override for a card upstream no longer has`);
      continue;
    }
    const r = applyOverride(card, o);
    for (const w of r.warnings) warnings.push(`${id}: override: ${w}`);
    for (const f of r.fatals) fatals.push(`${id}: override: ${f}`);
    for (const f of r.supplies) count(`override: ${f}`);
    for (const p of o.textPatches ?? []) count(`override: ${p.field} patch`);
    if (o.keywords) count('override: printed keywords');
    if (o.verified) count('override: verified');
    // Clear assembly fatals that the override answers.
    for (const issue of asm.issues) {
      if (
        issue.id === id &&
        issue.level === 'fatal' &&
        issue.fields?.every((f) => r.supplies.has(f))
      ) {
        issue.level = 'warn';
        issue.msg += ' (answered by override)';
      }
    }
  }
  for (const i of asm.issues)
    (i.level === 'fatal' ? fatals : warnings).push(`${i.id}: ${i.kind}: ${i.msg}`);

  // Block and legality from the hand-kept format file.
  for (const card of asm.cards.values()) {
    card.block = blockOf(card.id, fmt, card.block);
    card.legality = {
      standard: standardLegality(card.id, card.block, fmt),
      extra: extraLegality(card.id, fmt),
    };
  }
  for (const c of asm.cards.values()) fatals.push(...validateCard(c).map((p) => `invalid: ${p}`));
  return {
    cards: asm.cards,
    fatals,
    warnings,
    summary: { ...asm.counts, ...overrideCount },
    setNames: asm.setNames,
    fetched: sources.map((s) => s.fetchedAt),
    printingCount: asm.printingCount,
    fmt,
    vocab,
    issues: asm.issues,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const log = (s: string) => console.log(s);
  const run = await pipeline({ refresh: args.has('--refresh'), log });
  const { fatals, warnings, summary } = run;

  const byKind = new Map<Issue['kind'], number>();
  for (const i of run.issues) byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + 1);
  log('\nRepairs by class:');
  for (const [k, n] of Object.entries(summary).sort()) log(`  ${k}: ${n}`);
  log(`\nWarnings: ${warnings.length} (full list in .cache/cards/report.json)`);
  for (const [k, n] of byKind) log(`  ${k}: ${n}`);

  const prev = readSnapshot(DATA);
  const scripted = loadScriptIndex(join(CARDS, 'effects'));
  const diff = diffSnapshots(prev, run.cards, scripted);
  log(
    `\nDiff against the previous snapshot (${prev ? `${prev.size} cards` : 'none'}; ${scripted.size} scripted cards):`,
  );
  log(formatDiff(diff));
  fatals.push(...diff.failures);

  mkdirSync(join(ROOT, '.cache/cards'), { recursive: true });
  writeFileSync(
    join(ROOT, '.cache/cards/report.json'),
    JSON.stringify(
      { summary, fatals, warnings, diff, suspiciousTypes: run.vocab.suspicious() },
      null,
      2,
    ),
  );

  if (fatals.length) {
    console.error(`\n${fatals.length} problem(s) stop the run:`);
    for (const f of fatals.slice(0, 80)) console.error(`  ${f}`);
    if (fatals.length > 80)
      console.error(`  … ${fatals.length - 80} more in .cache/cards/report.json`);
    process.exit(1);
  }
  if (args.has('--dry-run')) {
    log('\nDry run: nothing written.');
    return;
  }
  write(run.cards, run.setNames, run.fmt, run.fetched, run.printingCount, summary);
}

function write(
  cards: Map<string, Card>,
  setNames: Map<string, string>,
  fmt: StandardFormat,
  fetched: string[],
  printingCount: number,
  repairs: Record<string, number>,
) {
  const bySet = new Map<string, Card[]>();
  for (const c of cards.values()) bySet.set(c.set, [...(bySet.get(c.set) ?? []), c]);
  rmSync(join(DATA, 'sets'), { recursive: true, force: true });
  mkdirSync(join(DATA, 'sets'), { recursive: true });
  const sets: SetSummary[] = [];
  for (const code of [...bySet.keys()].sort((a, b) => setOrder(a) - setOrder(b))) {
    const list = bySet.get(code)!.sort((a, b) => (a.id < b.id ? -1 : 1));
    const prefix = /^[A-Z]+/.exec(code)![0];
    const summary: SetSummary = {
      code,
      name: setNames.get(code) ?? code,
      kind: KIND[prefix] ?? 'promo',
      cardCount: list.length,
      block: fmt.blocksByProduct[code]?.block ?? null,
    };
    sets.push(summary);
    const file: SetFile = { set: summary, cards: list };
    writeFileSync(join(DATA, 'sets', `${code}.json`), `${JSON.stringify(file, null, 1)}\n`);
  }
  const boosters = sets.filter((s) => s.kind === 'booster').map((s) => s.code);
  const manifest: Manifest = {
    source: 'optcgapi.com (normalized; see cards/README.md)',
    sourceUrl: API_BASE,
    fetchedAt: fetched.sort().at(-1)!,
    generatedAt: new Date().toISOString(),
    cardCount: cards.size,
    printingCount,
    newestSet: boosters.sort((a, b) => setOrder(a) - setOrder(b)).at(-1)!,
    verifiedCount: [...cards.values()].filter((c) => c.verified).length,
    sets,
    repairs,
  };
  writeFileSync(join(DATA, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `\nWrote ${cards.size} cards in ${sets.length} set files; newest set ${manifest.newestSet}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
