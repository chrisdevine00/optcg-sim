/**
 * M10 WP6: scripts/licences.ts on a fixture tree (a real directory of packages with licence files),
 * so the walk, the allowlist and the file are all exercised the way the build runs them. Reverts:
 * allow everything (`verdictOf` returns 'ok') and the missing, unknown and copyleft tests fail; stop
 * deduplicating in `renderThirdParty` and the dedupe test fails; stop walking nested dependencies
 * and the transitive test fails.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  ALLOWED,
  collect,
  declaredLicence,
  problemsOf,
  renderThirdParty,
  verdictOf,
  type Dep,
} from '../../scripts/licences.ts';

const root = mkdtempSync(join(tmpdir(), 'optcg-licences-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

interface Fx {
  version?: string;
  license?: unknown;
  licenses?: unknown;
  deps?: Record<string, string>;
  optional?: Record<string, string>;
  file?: [string, string] | null;
}

/** Writes `<dir>/node_modules/<name>` with a package.json and (unless `file` is null) a licence file. */
function pkg(dir: string, name: string, fx: Fx = {}): string {
  const at = join(dir, 'node_modules', name);
  mkdirSync(at, { recursive: true });
  writeFileSync(
    join(at, 'package.json'),
    JSON.stringify({
      name,
      version: fx.version ?? '1.0.0',
      ...(fx.license === undefined ? {} : { license: fx.license }),
      ...(fx.licenses === undefined ? {} : { licenses: fx.licenses }),
      dependencies: fx.deps,
      optionalDependencies: fx.optional,
    }),
  );
  const file: [string, string] | null =
    fx.file === undefined ? ['LICENSE', `MIT text for ${name}`] : fx.file;
  if (file) writeFileSync(join(at, file[0]), file[1]);
  return at;
}

/** A fresh app directory whose package.json lists `deps`. */
function app(deps: string[]): string {
  const dir = mkdtempSync(join(root, 'app-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'fixture-app',
      version: '1.0.0',
      dependencies: Object.fromEntries(deps.map((d) => [d, '*'])),
    }),
  );
  return dir;
}

describe('verdictOf (the allowlist)', () => {
  it.each(ALLOWED)('allows %s', (id) => expect(verdictOf(id)).toBe('ok'));
  it('allows an OR expression with one allowed side, and an AND only when every side is allowed', () => {
    expect(verdictOf('(MIT OR GPL-3.0-only)')).toBe('ok');
    expect(verdictOf('MIT AND Apache-2.0')).toBe('ok');
    expect(verdictOf('MIT AND GPL-3.0-only')).toBe('copyleft');
  });
  it('refuses an empty licence, an unknown one and every strong copyleft family', () => {
    expect(verdictOf('')).toBe('none');
    expect(verdictOf('SEE LICENSE IN LICENSE.md')).toBe('unknown');
    expect(verdictOf('Custom')).toBe('unknown');
    for (const id of ['GPL-2.0-only', 'GPL-3.0-or-later', 'AGPL-3.0-only', 'LGPL-2.1-or-later']) {
      expect(verdictOf(id), id).toBe('copyleft');
    }
  });
  it('reads the legacy fields', () => {
    expect(declaredLicence({ license: { type: 'ISC' } })).toBe('ISC');
    expect(declaredLicence({ licenses: [{ type: 'MIT' }, { type: 'Apache-2.0' }] })).toBe(
      'MIT OR Apache-2.0',
    );
    expect(declaredLicence({})).toBe('');
  });
});

describe('collect and problemsOf on a fixture tree', () => {
  it('passes a tree of allowed licences', () => {
    const dir = app(['ok-a', 'ok-b']);
    pkg(dir, 'ok-a', { license: 'MIT' });
    pkg(dir, 'ok-b', { license: 'ISC', file: ['LICENCE.md', 'ISC text'] });
    const deps = collect(dir);
    expect(deps.map((d) => d.name)).toEqual(['ok-a', 'ok-b']);
    expect(problemsOf(deps)).toEqual([]);
  });

  it('fails a package that declares no licence', () => {
    const dir = app(['nolicence']);
    pkg(dir, 'nolicence', {});
    expect(problemsOf(collect(dir))).toEqual(['nolicence@1.0.0: declares no licence']);
  });

  it('fails a licence that is not on the allowlist', () => {
    const dir = app(['odd']);
    pkg(dir, 'odd', { license: 'WTFPL' });
    expect(problemsOf(collect(dir))[0]).toMatch(/odd@1\.0\.0: WTFPL is not on the allowlist/);
  });

  it('fails copyleft, even three levels down', () => {
    const dir = app(['top']);
    pkg(dir, 'top', { license: 'MIT', deps: { mid: '*' } });
    pkg(dir, 'mid', { license: 'MIT', deps: { deep: '*' } });
    pkg(dir, 'deep', { license: 'AGPL-3.0-only' });
    expect(problemsOf(collect(dir))).toEqual([
      'deep@1.0.0: AGPL-3.0-only is copyleft and may not ship',
    ]);
  });

  it('fails a known licence that ships no licence text', () => {
    const dir = app(['notext']);
    pkg(dir, 'notext', { license: 'MIT', file: null });
    expect(problemsOf(collect(dir))).toEqual(['notext@1.0.0: MIT but ships no licence text']);
  });

  it('finds a nested copy (the nearest node_modules wins) and visits each installed copy once', () => {
    const dir = app(['a', 'b']);
    pkg(dir, 'a', { license: 'MIT', deps: { shared: '*' } });
    pkg(dir, 'b', { license: 'MIT', deps: { shared: '*' } });
    pkg(dir, 'shared', { license: 'MIT', version: '2.0.0' });
    // b has its own older copy of "shared" nested under it.
    pkg(join(dir, 'node_modules', 'b'), 'shared', { license: 'MIT', version: '1.0.0' });
    const seen = collect(dir).map((d) => `${d.name}@${d.version}`);
    expect(seen.sort()).toEqual(['a@1.0.0', 'b@1.0.0', 'shared@1.0.0', 'shared@2.0.0']);
  });

  it('skips an optional dependency that is not installed, but not a required one', () => {
    const dir = app(['host']);
    pkg(dir, 'host', { license: 'MIT', optional: { 'only-on-linux': '*' } });
    expect(collect(dir).map((d) => d.name)).toEqual(['host']);
    const dir2 = app(['host2']);
    pkg(dir2, 'host2', { license: 'MIT', deps: { missing: '*' } });
    expect(() => collect(dir2)).toThrow(/missing .* is not installed/);
  });

  it('walks our own workspace packages for their dependencies but does not list them', () => {
    const dir = app(['@optcg/ai']);
    const ai = pkg(dir, '@optcg/ai', { license: undefined, deps: { dep: '*' } });
    pkg(ai, 'dep', { license: 'MIT' });
    expect(collect(dir).map((d) => d.name)).toEqual(['dep']);
  });
});

describe('renderThirdParty', () => {
  const dep = (name: string, license: string, text: string): Dep => ({
    name,
    version: '1.0.0',
    license,
    text,
  });

  it('writes each distinct licence text once, with every package that carries it', () => {
    const mit = 'Permission is hereby granted, free of charge';
    const out = renderThirdParty(
      [dep('b', 'MIT', mit), dep('a', 'MIT', mit + '\n'), dep('c', 'ISC', 'ISC text')],
      '1.0.0',
    );
    expect(out.split(mit)).toHaveLength(2); // once
    expect(out).toContain('3 packages, 2 distinct licence texts.');
    expect(out).toMatch(/Licence: MIT\nUsed by:\n {2}a@1\.0\.0\n {2}b@1\.0\.0/);
    expect(out).toContain('shipped in OPTCG Sim 1.0.0');
  });
});
