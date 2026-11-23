/**
 * `npm run test:ci` (PLAN §2a M6b-0): `npm test` minus the per-card test files of cards this push did
 * not change. The base is `CARD_TESTS_BASE` (CI passes the PR base or the push's previous commit);
 * with no usable base, or a change every card depends on, everything runs. The nightly runs `npm test`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD_TEST_DIRS, selectCardTests } from '../cards/scripts/card-tests.ts';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function walk(dir: string): string[] {
  const abs = join(ROOT, dir);
  try {
    return readdirSync(abs).flatMap((f) => {
      const p = join(abs, f);
      return statSync(p).isDirectory() ? walk(relative(ROOT, p)) : [relative(ROOT, p)];
    });
  } catch {
    return [];
  }
}

function changedSince(base: string | undefined): string[] | null {
  if (!base || /^0+$/.test(base)) return null;
  try {
    const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

const files = CARD_TEST_DIRS.flatMap((d) => walk(d)).filter((f) => /\.test\.tsx?$/.test(f));
const sel = selectCardTests(changedSince(process.env.CARD_TESTS_BASE), files);
const env = { ...process.env };
if (sel.all) console.log(`Card tests: all (${sel.reason}).`);
else {
  console.log(
    `Card tests: ${sel.cards.length} changed card(s) ${sel.cards.join(', ')}; ${sel.skip.length} files left to the nightly.`,
  );
  mkdirSync(join(ROOT, '.cache'), { recursive: true });
  const skipFile = join(ROOT, '.cache/card-tests-skip.json');
  writeFileSync(skipFile, JSON.stringify(sel.skip));
  env.CARD_TESTS_SKIP = skipFile;
}
const r = spawnSync('npx', ['vitest', 'run', ...process.argv.slice(2)], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
