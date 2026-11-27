/**
 * M10 WP5: the owner's listening sheet and the WCAG audit document stay tied to the code.
 *
 * - the sheet (`M10-listening-pass.md`) is generated from every screen-reader script's step table and
 *   must equal a fresh render; every step of every script is in it once, and a script file in
 *   `app/a11y/src` without an entry in `index-steps.ts` fails;
 * - the audit document (`m10-wcag-audit.md`) has a row for every WCAG 2.2 level A and AA success
 *   criterion (the list is a constant here), none twice, no criterion outside the list, and 4.1.1
 *   listed as removed from 2.2; its claim section holds the conditions.
 *
 * Reverts that fail these: add a step to `m9.ts` without running `npx tsx scripts/a11y-sheet.ts`; add
 * `m11.ts` with `M11_STEPS` and no entry in `index-steps.ts`; delete a row of the audit table; change a
 * step's text in a script; drop the set-up markers from the README.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCRIPTS } from '../a11y/src/index-steps.ts';
import { renderSheet, setupBlock, stepRow } from '../../scripts/a11y-sheet.ts';

const root = new URL('../../', import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), 'utf8');
const SHEET = 'docs/design/a11y-passes/M10-listening-pass.md';
const AUDIT = 'docs/design/a11y-passes/m10-wcag-audit.md';

/** Every WCAG 2.2 success criterion at level A or AA (4.1.1 Parsing is removed from 2.2). 55 of them. */
export const WCAG22_A_AA = [
  '1.1.1',
  '1.2.1',
  '1.2.2',
  '1.2.3',
  '1.2.4',
  '1.2.5',
  '1.3.1',
  '1.3.2',
  '1.3.3',
  '1.3.4',
  '1.3.5',
  '1.4.1',
  '1.4.2',
  '1.4.3',
  '1.4.4',
  '1.4.5',
  '1.4.10',
  '1.4.11',
  '1.4.12',
  '1.4.13',
  '2.1.1',
  '2.1.2',
  '2.1.4',
  '2.2.1',
  '2.2.2',
  '2.3.1',
  '2.4.1',
  '2.4.2',
  '2.4.3',
  '2.4.4',
  '2.4.5',
  '2.4.6',
  '2.4.7',
  '2.4.11',
  '2.5.1',
  '2.5.2',
  '2.5.3',
  '2.5.4',
  '2.5.7',
  '2.5.8',
  '3.1.1',
  '3.1.2',
  '3.2.1',
  '3.2.2',
  '3.2.3',
  '3.2.4',
  '3.2.6',
  '3.3.1',
  '3.3.2',
  '3.3.3',
  '3.3.4',
  '3.3.7',
  '3.3.8',
  '4.1.2',
  '4.1.3',
] as const;

/** The criteria 2.2 added at level A or AA: they must be in the table whatever else changes. */
const ADDED_IN_22 = ['2.4.11', '2.5.7', '2.5.8', '3.2.6', '3.3.7', '3.3.8'] as const;

describe('the listening sheet', () => {
  const sheet = read(SHEET);

  it('is up to date: it equals a fresh render of the scripts and the README block', () => {
    expect(sheet).toBe(renderSheet());
  });

  it('has every step of every script once, in its own script section, in script order', () => {
    for (const s of SCRIPTS) {
      const at = sheet.indexOf(`## ${s.name}: ${s.title}\n`);
      expect(at, `${s.id}: no section`).toBeGreaterThanOrEqual(0);
      const next = sheet.indexOf('\n## ', at + 4);
      const section = sheet.slice(at, next < 0 ? undefined : next);
      const rows = section.split('\n').filter((l) => /^\| `[^`]+` \|/.test(l));
      expect(
        rows.map((r) => /^\| `([^`]+)`/.exec(r)![1]),
        `${s.id}: the rows are the steps, in order`,
      ).toEqual(s.steps.map((t) => t.id));
      for (const t of s.steps) {
        expect(
          section.split(stepRow(t.id, t.do, t.expect)).length - 1,
          `${s.id} step ${t.id} appears exactly once, with its Do and Expect text`,
        ).toBe(1);
      }
    }
  });

  it('has no step id twice within a script, and a title, Do and Expect for each', () => {
    for (const s of SCRIPTS) {
      const ids = s.steps.map((t) => t.id);
      expect(new Set(ids).size, `${s.id}: duplicate step id`).toBe(ids.length);
      for (const t of s.steps) {
        expect(t.title.length, `${s.id} ${t.id} title`).toBeGreaterThan(0);
        expect(t.do.length, `${s.id} ${t.id} do`).toBeGreaterThan(0);
        expect(t.expect.length, `${s.id} ${t.id} expect`).toBeGreaterThan(0);
      }
    }
  });

  it('lists every script in app/a11y/src: a new script without an entry fails', () => {
    const files = readdirSync(new URL('app/a11y/src/', root))
      .filter((f) => /^(?!steps|index-steps).*\.ts$/.test(f))
      .filter((f) => /export const [A-Z0-9_]+_STEPS\b/.test(read(`app/a11y/src/${f}`)))
      .map((f) => f.replace(/\.ts$/, ''))
      .sort();
    expect(files).toEqual(SCRIPTS.map((s) => s.id).sort());
  });

  it('copies the README set-up block, and ends with the by-hand keyboard game', () => {
    const readme = read('docs/design/a11y-passes/README.md');
    expect(sheet).toContain(setupBlock(readme));
    expect(sheet).toMatch(/\| `K1` \| Play a whole game against the Warlord/);
    expect(sheet.trimEnd().split('\n').at(-1)).toMatch(/^\| `K1` \|/);
  });

  it('keeps the Result and Heard columns blank for the owner', () => {
    const rows = sheet.split('\n').filter((l) => /^\| `[^`]+` \|/.test(l));
    expect(rows.length).toBe(SCRIPTS.reduce((n, s) => n + s.steps.length, 0) + 1);
    for (const r of rows) expect(r.endsWith('|  |  |'), r.slice(0, 40)).toBe(true);
  });
});

describe('the M10 script is wired like the others', () => {
  it('has a dry, an NVDA and a VoiceOver spec that run it, with service workers allowed', () => {
    for (const k of ['dry', 'nvda', 'voiceover']) {
      const spec = read(`app/a11y/m10.${k}.spec.ts`);
      expect(spec, k).toContain('runM10(pass)');
      expect(spec, k).toContain("serviceWorkers: 'allow'");
    }
  });

  it('is a choice of the manual NVDA workflow and part of "all"', () => {
    const wf = read('.github/workflows/a11y-nvda.yml');
    expect(wf).toContain("'m10' { 'm10\\.nvda' }");
    expect(wf).toMatch(/'all' \{ [^}]*m10\\\.nvda/);
    expect(wf).toMatch(/options: \[[^\]]*\bm10\b/);
  });
});

describe('the WCAG 2.2 audit document', () => {
  const audit = read(AUDIT);
  /** The table rows whose first cell starts with a criterion number. */
  const rows = audit.split('\n').filter((l) => /^\| \d\.\d\.\d+ /.test(l));
  const cellsOf = (l: string) =>
    l
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map((c) => c.trim());
  const numbers = rows.map((r) => /^\| (\d\.\d\.\d+) /.exec(r)![1]!);

  it('has 55 criteria in the constant, 2.2 additions among them, none twice', () => {
    expect(WCAG22_A_AA.length).toBe(55);
    expect(new Set(WCAG22_A_AA).size).toBe(55);
    for (const c of ADDED_IN_22) expect(WCAG22_A_AA).toContain(c);
    expect(WCAG22_A_AA).not.toContain('4.1.1' as never);
  });

  it('has a row for every success criterion from 1.1.1 to 4.1.3, and no other', () => {
    const missing = WCAG22_A_AA.filter((c) => !numbers.includes(c));
    expect(missing, 'criteria with no row').toEqual([]);
    const extra = numbers.filter(
      (n) => !(WCAG22_A_AA as readonly string[]).includes(n) && n !== '4.1.1',
    );
    expect(extra, 'rows that are not a WCAG 2.2 A or AA criterion').toEqual([]);
    expect(
      numbers.filter((n, i) => numbers.indexOf(n) !== i),
      'criteria twice',
    ).toEqual([]);
  });

  it('lists 4.1.1 as removed from 2.2, not as a criterion to meet', () => {
    const row = rows.find((r) => r.startsWith('| 4.1.1 '))!;
    expect(row, 'no 4.1.1 row').toBeDefined();
    expect(row).toMatch(/removed/i);
  });

  it('fills every column of every row: applies, how, evidence, checked by, result', () => {
    for (const r of rows) {
      const c = cellsOf(r);
      expect(c.length, r.slice(0, 30)).toBe(6);
      for (const [i, cell] of c.entries())
        expect(cell.length, `${c[0]} column ${i}`).toBeGreaterThan(0);
      expect(c[1], `${c[0]} applies`).toMatch(/^(yes|no)\b/i);
    }
  });

  it('says in each row who judged it, using only the named judges', () => {
    const judges = /automated|axe|audit spec|manual|NVDA|VoiceOver|review|not applicable/i;
    for (const r of rows) expect(cellsOf(r)[4], r.slice(0, 30)).toMatch(judges);
  });

  it('names evidence that exists: every repository path in the table is a file', () => {
    const paths = new Set<string>();
    for (const r of rows)
      for (const m of r.matchAll(
        /`((?:app|scripts|docs|engine|ai|cards)\/[\w./-]+\.(?:ts|tsx|md|css|yml|json))`/g,
      ))
        paths.add(m[1]!);
    expect(paths.size).toBeGreaterThan(10);
    for (const p of paths) expect(() => read(p), p).not.toThrow();
  });

  it('words the claim for what was done: conditions, no screen-reader user, no unqualified compliance', () => {
    const at = audit.indexOf('## The claim');
    expect(at).toBeGreaterThan(0);
    const claim = audit.slice(at);
    expect(claim).toMatch(/axe/i);
    expect(claim).toMatch(/NVDA/);
    expect(claim).toMatch(/VoiceOver/);
    expect(claim).toMatch(/no screen-reader user/i);
    // "fully compliant" may appear only inside a prohibition ("Do not write ...").
    for (const m of audit.matchAll(/fully compliant|fully conforms|WCAG 2\.2 AA compliant/gi)) {
      const before = audit.slice(Math.max(0, m.index! - 50), m.index!);
      expect(before, `unqualified claim near "${m[0]}"`).toMatch(
        /\b(do not|never) (write|say|claim)\b/i,
      );
    }
  });
});
