/**
 * `npm run cards:update [-- --refresh] [-- --dry-run] [-- --allow-script-changes]`
 *
 * Fetches optcgapi.com bulk endpoints (cached in .cache/cards/), and the Limitless card pages of a
 * product optcgapi lacks (ADR 0015; a card optcgapi has always comes from optcgapi, and its Limitless
 * page differences are reported), normalizes every defect class, applies
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
import { assemble, cardIdOf, type Issue, type SourcedRow } from './build.ts';
import { compareWithLimitless } from './limitless.ts';
import { rowProblems } from './normalize.ts';
import { diffSnapshots, formatDiff, loadScriptIndex } from './diff.ts';
import { applyOverride, loadOverrides } from './overrides.ts';
import {
  API_BASE,
  LIMITLESS_BASE,
  loadLimitless,
  loadSources,
  type LimitlessSource,
} from './sources.ts';
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
  /** Per Limitless product: cards read from Limitless, and cards optcgapi now has (with differences). */
  limitless: LimitlessReport[];
}

export interface LimitlessReport {
  code: string;
  fromLimitless: string[];
  /** Cards optcgapi has: their Limitless differences after overrides (empty list: they agree). */
  inOptcgapi: { id: string; differences: string[] }[];
}

/**
 * ADR 0015: a product optcgapi lacks comes from Limitless, card by card. A card optcgapi has in a set
 * or starter row is never taken from Limitless (its page is kept for the difference report); a promo
 * row alone does not count, since promos reprint cards before their booster is in optcgapi.
 */
export function mergeLimitless(
  rows: readonly SourcedRow[],
  limitless: readonly Pick<LimitlessSource, 'cards'>[],
): { inOptcgapi: Set<string>; added: SourcedRow[] } {
  const inOptcgapi = new Set(rows.filter((r) => r.file !== 'promos').map(cardIdOf));
  const added = limitless.flatMap((p) =>
    p.cards
      .filter((c) => !inOptcgapi.has(c.id))
      .map((c) => ({ ...c.row, file: 'limitless' as const, fetchedAt: c.fetchedAt })),
  );
  return { inOptcgapi, added };
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

  const limitless = await loadLimitless({
    cacheDir: join(ROOT, '.cache/cards'),
    refresh: opts.refresh,
    log,
  });
  const { inOptcgapi, added } = mergeLimitless(rows, limitless);
  rows.push(...added);
  for (const p of limitless) {
    const taken = p.cards.filter((c) => !inOptcgapi.has(c.id)).length;
    log(
      `${p.code}: ${taken} of ${p.cards.length} cards from ${p.setUrl}` +
        (taken < p.cards.length ? ` (${p.cards.length - taken} now in optcgapi)` : ''),
    );
  }

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
  const limitlessReport: LimitlessReport[] = limitless.map((p) => ({
    code: p.code,
    fromLimitless: p.cards.filter((c) => !inOptcgapi.has(c.id)).map((c) => c.id),
    inOptcgapi: p.cards
      .filter((c) => inOptcgapi.has(c.id) && asm.cards.has(c.id))
      .map((c) => ({ id: c.id, differences: compareWithLimitless(asm.cards.get(c.id)!, c.page) })),
  }));
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
    limitless: limitlessReport,
  };
}

/** The Limitless section of the run log: what came from Limitless, and what optcgapi now has. */
export function formatLimitless(report: LimitlessReport[]): string {
  const out: string[] = [];
  for (const p of report) {
    out.push(`  ${p.code}: ${p.fromLimitless.length} cards from Limitless card pages (ADR 0015).`);
    if (p.inOptcgapi.length === 0) continue;
    const differing = p.inOptcgapi.filter((c) => c.differences.length);
    out.push(
      `  ${p.code}: ${p.inOptcgapi.length} cards now come from optcgapi; ${differing.length} differ from their Limitless page:`,
    );
    for (const c of differing) out.push(`    ${c.id}\n      ${c.differences.join('\n      ')}`);
    if (p.fromLimitless.length === 0)
      out.push(
        `  ${p.code} is complete in optcgapi: settle the differences, then remove it from LIMITLESS_PRODUCTS (sources.ts).`,
      );
  }
  return out.join('\n');
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
  if (run.limitless.length) log(`\nLimitless products:\n${formatLimitless(run.limitless)}`);
  // The scheduled update PR (update.yml) writes anyway and lists them: the PR's CI then fails on
  // the scripts' text hashes until each card is re-verified (ARCHITECTURE §3 "Update pipeline").
  if (!args.has('--allow-script-changes')) fatals.push(...diff.failures);

  mkdirSync(join(ROOT, '.cache/cards'), { recursive: true });
  writeFileSync(
    join(ROOT, '.cache/cards/report.json'),
    JSON.stringify(
      {
        summary,
        fatals,
        warnings,
        diff,
        limitless: run.limitless,
        suspiciousTypes: run.vocab.suspicious(),
      },
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
  write(run.cards, run.setNames, run.fmt, run.fetched, run.printingCount, summary, run.limitless);
}

function write(
  cards: Map<string, Card>,
  setNames: Map<string, string>,
  fmt: StandardFormat,
  fetched: string[],
  printingCount: number,
  repairs: Record<string, number>,
  limitless: LimitlessReport[],
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
  const fromLimitless = limitless.filter((p) => p.fromLimitless.length).map((p) => p.code);
  const manifest: Manifest = {
    source:
      'optcgapi.com (normalized; see cards/README.md)' +
      (fromLimitless.length
        ? `; ${fromLimitless.join(', ')} from Limitless card pages (${LIMITLESS_BASE}, ADR 0015)`
        : ''),
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
