/**
 * Writes a drill's committed bank (M9): `npm run drills:bank -- lethal`. Banks are generated from
 * fixed seeds and node caps (never a clock), so a second run writes the same bytes. The file holds
 * card ids and scenarios only (no art), at `app/src/drills/banks/<drill>.json`.
 *
 * One generator per drill, each exported from `ai/src/search/drills/` and registered below with a
 * line in `GENERATORS`. A generator gets the card data, the twelve guides' Leaders and a log, and
 * returns the bank (extra fields `tried` and `counts` are for the log and are not written).
 *
 * Options: `--max-seeds N` stops the search after N seeds (the honest-numbers case: it writes what
 * it has and says it fell short). `--check` writes nothing and exits 1 when the committed file is
 * not what a fresh run produces.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { format, resolveConfig } from 'prettier';
import type { Card, SetFile } from '@optcg/cards';
import type { DrillBank, DrillId } from '../ai/src/search/drills/types.ts';

// Tests read the *pinned* meta lists (vitest.config.ts: `PINNED_META`), and CI re-verifies every bank
// item with them, so a bank is generated against the pinned lists too: the same file, whatever the
// weekly meta PR has since done to docs/research/meta-lists.json. tsx has no alias, so a resolve hook
// maps the one specifier the AI's prior imports; everything below is imported after it is in place.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `const PIN = ${JSON.stringify(new URL('../ai/test/fixtures/meta-lists.pinned.json', import.meta.url).href)};
export async function resolve(specifier, context, next) {
  if (/^(?:\\.\\.\\/)+docs\\/research\\/meta-lists\\.json$/.test(specifier)) return next(PIN, context);
  return next(specifier, context);
}`,
    ),
);
await import('../test-setup/scripts.ts');

interface GenContext {
  cards: ReadonlyMap<string, Card>;
  leaders: string[];
  maxSeeds?: number;
  log: (line: string) => void;
}
type Generator = (ctx: GenContext) => Promise<DrillBank & { tried?: number; counts?: unknown }>;

/** drill -> generator. WP3 adds `mulligan`, `counter` and `don` here, one line each. */
const GENERATORS: Partial<Record<DrillId, Generator>> = {
  counter: async (ctx) =>
    (await import('../ai/src/search/drills/counter.ts')).generateCounterBank(ctx.cards, {
      ...(ctx.maxSeeds ? { maxSeeds: ctx.maxSeeds } : {}),
      log: ctx.log,
    }),
  don: async (ctx) =>
    (await import('../ai/src/search/drills/don.ts')).generateDonBank(ctx.cards, {
      ...(ctx.maxSeeds ? { maxSeeds: ctx.maxSeeds } : {}),
      log: ctx.log,
    }),
  mulligan: async (ctx) =>
    (await import('../ai/src/search/drills/mulligan.ts')).generateMulliganBank(ctx.cards, {
      log: ctx.log,
    }),
  lethal: async (ctx) =>
    (await import('../ai/src/search/drills/lethal-gen.ts')).generateLethalBank(ctx.cards, {
      leaders: ctx.leaders,
      ...(ctx.maxSeeds ? { maxSeeds: ctx.maxSeeds } : {}),
      log: ctx.log,
    }),
};

function loadCards(): Map<string, Card> {
  const cards = new Map<string, Card>();
  const dir = new URL('../cards/data/sets/', import.meta.url);
  for (const f of readdirSync(dir))
    for (const c of (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile).cards)
      cards.set(c.id, c);
  return cards;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const drill = args.find((a) => !a.startsWith('--')) as DrillId | undefined;
  const check = args.includes('--check');
  const mi = args.indexOf('--max-seeds');
  const maxSeeds = mi >= 0 ? Number(args[mi + 1]) : undefined;
  const gen = drill ? GENERATORS[drill] : undefined;
  if (!drill || !gen) {
    console.error(
      `usage: npm run drills:bank -- <${Object.keys(GENERATORS).join('|')}> [--check] [--max-seeds N]`,
    );
    process.exit(2);
  }
  const meta = JSON.parse(
    readFileSync(new URL('../ai/test/fixtures/meta-lists.pinned.json', import.meta.url), 'utf8'),
  ) as {
    archetypes: {
      leaderId: string;
      lists: { date: string; main: { id: string; count: number }[] }[];
    }[];
  };
  // The resolve hook must have taken: the prior the solver reads is the pinned file's.
  const { priorFor } = await import('../ai/src/knowledge.ts');
  const first = meta.archetypes[0]!;
  const seen = JSON.stringify(priorFor(first.leaderId).lists.map((l) => l.cards));
  const want = [...first.lists]
    .sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))
    .map((l) => l.main);
  const wantJson = JSON.stringify(want);
  if (seen !== wantJson) {
    console.error('the pinned meta lists were not applied; refusing to write a bank');
    process.exit(3);
  }
  const leaders = meta.archetypes.map((a) => a.leaderId);
  const tally = new Map<string, number>();
  const bank = await gen({
    cards: loadCards(),
    leaders,
    ...(maxSeeds ? { maxSeeds } : {}),
    log: (l) => {
      const k = l.replace(/^seed \d+ \S+: /, '');
      tally.set(k, (tally.get(k) ?? 0) + 1);
    },
  });
  const file = new URL(`../app/src/drills/banks/${drill}.json`, import.meta.url);
  const path = file.pathname;
  const cfg = (await resolveConfig(path)) ?? {};
  const { bankJson } = await import('../ai/src/search/drills/lethal-gen.ts');
  const text = await format(bankJson(bank), { ...cfg, parser: 'json' });
  console.error(
    `${drill}: ${bank.items.length} items from ${bank.tried ?? '?'} seeds ${JSON.stringify(bank.counts ?? {})}`,
  );
  for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.error(`  ${n} x ${k}`);
  if (check) {
    const same = existsSync(path) && readFileSync(path, 'utf8') === text;
    console.error(same ? 'committed bank is current' : 'committed bank DIFFERS from a fresh run');
    process.exit(same ? 0 : 1);
  }
  writeFileSync(path, text);
  console.error(`wrote ${path}`);
}

void main();
