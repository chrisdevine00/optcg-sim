/**
 * Third-party licences (M10 WP6). Walks the production dependency tree of `@optcg/app` (its
 * `dependencies`, and theirs, as `node_modules` resolves them), reads each package's licence id and
 * licence text, writes `app/public/third-party.txt` (deduplicated by text; the build copies it into dist and the service worker precaches it) and FAILS the build on a
 * package with no licence, an unknown one, or a strong copyleft one (GPL, AGPL, LGPL).
 *
 *   tsx scripts/licences.ts             writes app/public/third-party.txt (run before the build: `prebuild`)
 *   tsx scripts/licences.ts --credits   writes docs/legal/CREDITS.md from app/src/about/credits.ts
 *
 * Our own workspace packages (`@optcg/*`) are walked for their dependencies but not listed: they are
 * this project, whose licence the owner has not chosen yet.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Licences that may ship in the app. Extend only with a reason in the comment. */
export const ALLOWED: readonly string[] = [
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'OFL-1.1', // the Inter and Fraunces fonts
  '0BSD',
  'CC0-1.0',
  'BlueOak-1.0.0',
  'Python-2.0', // argparse
];

const COPYLEFT = /^(?:A|L)?GPL/i;

export interface Dep {
  name: string;
  version: string;
  /** The licence as the package declares it (an SPDX id or expression); '' when it declares none. */
  license: string;
  /** The licence file's text; '' when the package ships none. */
  text: string;
}

/** `MIT`, `(MIT OR Apache-2.0)`, `{type: 'MIT'}` and `licenses: [{type}]` to one SPDX-style string. */
export function declaredLicence(pkg: Record<string, unknown>): string {
  const one = (v: unknown): string =>
    typeof v === 'string'
      ? v
      : typeof v === 'object' && v !== null
        ? one((v as { type?: unknown }).type)
        : '';
  const l = one(pkg.license);
  if (l) return l.trim();
  if (Array.isArray(pkg.licenses)) {
    const ids = pkg.licenses.map(one).filter(Boolean);
    if (ids.length) return ids.join(' OR ');
  }
  return '';
}

export type Verdict = 'ok' | 'none' | 'unknown' | 'copyleft';

/** An SPDX expression against the allowlist: an `OR` needs one allowed side, an `AND` every side. */
export function verdictOf(license: string, allowed: readonly string[] = ALLOWED): Verdict {
  const expr = license.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!expr) return 'none';
  const side = (id: string): Verdict =>
    allowed.includes(id) ? 'ok' : COPYLEFT.test(id) ? 'copyleft' : 'unknown';
  const alternatives = expr
    .split(/ OR /i)
    .map((alt) => alt.split(/ AND /i).map((id) => side(id.trim())));
  if (alternatives.some((all) => all.every((v) => v === 'ok'))) return 'ok';
  const worst = alternatives.flat();
  return worst.includes('copyleft') ? 'copyleft' : 'unknown';
}

/** One line per package that must not ship, or none. */
export function problemsOf(deps: readonly Dep[], allowed: readonly string[] = ALLOWED): string[] {
  const out: string[] = [];
  for (const d of deps) {
    const v = verdictOf(d.license, allowed);
    const at = `${d.name}@${d.version}`;
    if (v === 'none') out.push(`${at}: declares no licence`);
    else if (v === 'copyleft') out.push(`${at}: ${d.license} is copyleft and may not ship`);
    else if (v === 'unknown')
      out.push(`${at}: ${d.license} is not on the allowlist (scripts/licences.ts ALLOWED)`);
    else if (!d.text.trim()) out.push(`${at}: ${d.license} but ships no licence text`);
  }
  return out;
}

/** The file: a header, then each distinct licence text once, with the packages that carry it. */
export function renderThirdParty(deps: readonly Dep[], release: string): string {
  const byText = new Map<string, Dep[]>();
  for (const d of [...deps].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  )) {
    const key = d.text.trim();
    byText.set(key, [...(byText.get(key) ?? []), d]);
  }
  const rule = '='.repeat(72);
  const out = [
    `Third-party licences shipped in OPTCG Sim ${release}`,
    '',
    'Generated at build time by scripts/licences.ts from the production dependency tree.',
    `${deps.length} packages, ${byText.size} distinct licence texts.`,
    '',
  ];
  for (const [text, group] of byText) {
    const ids = [...new Set(group.map((d) => d.license))].join(', ');
    out.push(
      rule,
      `Licence: ${ids}`,
      'Used by:',
      ...group.map((d) => `  ${d.name}@${d.version}`),
      '',
      text,
      '',
    );
  }
  return out.join('\n');
}

/** The directory of `name` as Node resolves it from `from`: the nearest `node_modules/<name>` up the tree. */
function locate(name: string, from: string): string | null {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    if (dirname(dir) === dir) return null;
  }
}

/** The text of the package's licence files (`LICENSE*`, `LICENCE*`, `COPYING*`), joined; '' if none. */
function licenceText(dir: string): string {
  return readdirSync(dir)
    .filter((f) => /^(?:licen[cs]e|copying)(?:[.-].*)?$/i.test(f))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Every package the app's production tree reaches, from the package at `rootDir` (its `dependencies`
 * and `optionalDependencies`, recursively), once per installed copy. `firstParty` names are walked
 * but not returned.
 */
export function collect(rootDir: string, firstParty: RegExp = /^@optcg\//): Dep[] {
  const seen = new Set<string>();
  const out: Dep[] = [];
  const visit = (dir: string, listed: boolean): void => {
    const real = realpathSync(dir);
    if (seen.has(real)) return;
    seen.add(real);
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    if (listed) {
      out.push({
        name: String(pkg.name),
        version: String(pkg.version ?? '0.0.0'),
        license: declaredLicence(pkg),
        text: licenceText(dir),
      });
    }
    const wanted = {
      ...(pkg.optionalDependencies as Record<string, string> | undefined),
      ...(pkg.dependencies as Record<string, string> | undefined),
    };
    for (const name of Object.keys(wanted).sort()) {
      const at = locate(name, realpathSync(dir));
      // An optional dependency that was not installed on this platform is not shipped.
      if (!at) {
        if ((pkg.optionalDependencies as Record<string, string> | undefined)?.[name]) continue;
        throw new Error(`${name} (needed by ${String(pkg.name)}) is not installed`);
      }
      visit(at, !firstParty.test(name));
    }
  };
  visit(rootDir, false);
  return out;
}

async function main(): Promise<void> {
  const repo = resolve(import.meta.dirname, '..');
  if (process.argv.includes('--credits')) {
    const { creditsMarkdown } = await import('../app/src/about/credits.ts');
    const file = join(repo, 'docs/legal/CREDITS.md');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, creditsMarkdown());
    console.log('licences: wrote docs/legal/CREDITS.md');
    return;
  }
  const appDir = join(repo, 'app');
  const release = (
    JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8')) as { version: string }
  ).version;
  const deps = collect(appDir);
  const problems = problemsOf(deps);
  if (problems.length > 0) {
    console.error(`licences: ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  const out = join(appDir, 'public/third-party.txt');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderThirdParty(deps, release));
  const ids = [...new Set(deps.map((d) => d.license))].sort();
  console.log(
    `licences: ${deps.length} packages, all allowed (${ids.join(', ')}); wrote app/public/third-party.txt (copied into dist by the build)`,
  );
}

if (process.argv[1] && import.meta.filename === realpathSync(process.argv[1])) await main();
