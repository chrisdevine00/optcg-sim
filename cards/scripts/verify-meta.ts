/**
 * `npm run cards:verify-meta [-- --set <SET>] [-- --fetch] [-- --write]`
 *
 * M1 verification of every card in docs/research/meta-lists.json: compares the normalized card (after
 * overrides) with its Limitless card page, field by field. Pages are read from .cache/m1/limitless/
 * (Track G's .cache/track-g/limitless/ is reused); `--fetch` downloads missing ones about one per second
 * (robots.txt allows all). Disagreements are printed for a person to settle on the official card list,
 * one card at a time, and record as an override. `--write` marks cards with no disagreement as verified:
 * it writes or updates their override with the Limitless source and the printed keywords.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Keyword } from '../src/schema.ts';
import { compareWithLimitless, parseLimitless } from './limitless.ts';
import { printedKeywords } from './normalize.ts';
import type { Override } from './overrides.ts';
import { USER_AGENT } from './sources.ts';
import { pipeline } from './update.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// cards:update's Limitless cache (ADR 0015) first, then the M1 and Track G caches.
const PAGES = [
  join(ROOT, '.cache/cards/limitless'),
  join(ROOT, '.cache/m1/limitless'),
  join(ROOT, '.cache/track-g/limitless'),
];
const OVERRIDES = join(ROOT, 'cards/overrides');

export function metaIds(metaListsJson: unknown): string[] {
  const ids = new Set<string>();
  const walk = (o: unknown): void => {
    if (typeof o === 'string') {
      if (/^(OP|ST|EB|PRB)\d{2}-\d{3}$|^P-\d{3}$/.test(o)) ids.add(o);
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk((metaListsJson as { archetypes: unknown }).archetypes);
  return [...ids].sort();
}

function pagePath(id: string): string | null {
  for (const dir of PAGES) {
    const p = join(dir, `${id}.html`);
    if (existsSync(p) && statSync(p).size > 0) return p;
  }
  return null;
}

async function fetchPage(id: string): Promise<void> {
  const res = await fetch(`https://onepiece.limitlesstcg.com/cards/${id}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  mkdirSync(PAGES[1]!, { recursive: true });
  writeFileSync(join(PAGES[1]!, `${id}.html`), await res.text());
  await new Promise((r) => setTimeout(r, 1100));
}

async function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  // `--set <SET>`: every card of one product (a scripting batch, runbook step d.1), not the meta lists.
  const set = argv.includes('--set') ? argv[argv.indexOf('--set') + 1] : undefined;
  const ids = set
    ? [...(await pipeline({ refresh: false, log: () => {} })).cards.values()]
        .filter((c) => c.set === set)
        // Verification matters for play: Standard cards only (block 1 reprints stay as they are).
        .filter((c) => ['legal', 'restricted', 'unknown'].includes(c.legality.standard.status))
        .map((c) => c.id)
        .sort()
    : metaIds(JSON.parse(readFileSync(join(ROOT, 'docs/research/meta-lists.json'), 'utf8')));
  if (set && ids.length === 0) throw new Error(`no cards in set ${set}`);
  if (args.has('--fetch')) for (const id of ids) if (!pagePath(id)) await fetchPage(id);
  const run = await pipeline({ refresh: false, log: () => {} });
  let clean = 0;
  let written = 0;
  const problems: string[] = [];
  for (const id of ids) {
    const card = run.cards.get(id);
    const page = pagePath(id);
    if (!card || !page) {
      problems.push(
        `${id}: ${card ? 'no Limitless page cached (use --fetch)' : 'not in the card data'}`,
      );
      continue;
    }
    const lim = parseLimitless(readFileSync(page, 'utf8'));
    const d = compareWithLimitless(card, lim);
    const blockNote =
      lim.block && String(card.block) !== lim.block
        ? ` (block: ours ${String(card.block)}, limitless ${lim.block})`
        : '';
    if (d.length) {
      problems.push(`${id} ${card.name}${blockNote}\n    ${d.join('\n    ')}`);
      continue;
    }
    clean++;
    if (blockNote) problems.push(`${id} ${card.name}: block only${blockNote}`);
    if (args.has('--write')) {
      const file = join(OVERRIDES, `${id}.json`);
      const date = statSync(page).mtime.toISOString().slice(0, 10);
      const existing: Partial<Override> = existsSync(file)
        ? (JSON.parse(readFileSync(file, 'utf8')) as Override)
        : {};
      const url = `https://onepiece.limitlesstcg.com/cards/${id}`;
      const sources = (existing.sources ?? []).filter((s) => s.url !== url);
      const o: Override = {
        id,
        verified: true,
        sources: [{ url, date, use: 'cross-check' }, ...sources],
        keywords: printedKeywords(lim.effectText) as Keyword[],
        ...(existing.fields ? { fields: existing.fields } : {}),
        ...(existing.textPatches ? { textPatches: existing.textPatches } : {}),
        ...(existing.block ? { block: existing.block } : {}),
        ...(existing.artFocus ? { artFocus: existing.artFocus } : {}),
        ...(existing.note ? { note: existing.note } : {}),
      };
      mkdirSync(OVERRIDES, { recursive: true });
      writeFileSync(file, `${JSON.stringify(o, null, 2)}\n`);
      written++;
    }
  }
  console.log(
    `${ids.length} meta cards; ${clean} match Limitless; ${ids.length - clean} need attention.`,
  );
  if (args.has('--write')) console.log(`${written} overrides written or updated.`);
  for (const p of problems) console.log(p);
  const unverified = ids.filter((id) => !run.cards.get(id)?.verified);
  console.log(`\nverified: ${ids.length - unverified.length} of ${ids.length}`);
  if (unverified.length) console.log(`not verified: ${unverified.join(', ')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
