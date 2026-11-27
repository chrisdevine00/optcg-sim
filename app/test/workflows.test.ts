/**
 * M10 fix round: the two workflow files are parsed and checked, so a revert of a fix fails per push
 * instead of showing up as a red night or a release of the wrong commit.
 *
 * R1 (deploy builds the commit whose CI passed). Revert: remove `ref:` from the build job's checkout,
 * or the `commit` check from the verify job, and the first two tests fail.
 * R4 (the Emperor job ran the whole strength file). Revert: set the emperor filter back to
 * 'Emperor' (it matches the describe title, so every test of the file) and the third test fails.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
  id?: string;
}
interface Job {
  steps?: Step[];
  env?: Record<string, string>;
  'timeout-minutes'?: number | string;
  strategy?: { matrix: { series?: { name: string; filter: string; minutes: number }[] } };
}
const workflow = (rel: string) =>
  parse(read(rel)) as { on: Record<string, unknown>; jobs: Record<string, Job> };

describe('deploy.yml builds the commit whose CI passed (M10-R1)', () => {
  const wf = workflow('../../.github/workflows/deploy.yml');
  const build = wf.jobs.build!;
  const verify = wf.jobs.verify!;
  const SHA = '${{ github.event.workflow_run.head_sha || github.sha }}';

  it('is triggered by the CI workflow_run on main, and the build job checks out that run’s head_sha', () => {
    const run = wf.on.workflow_run as { workflows: string[]; branches: string[] };
    expect(run.workflows).toEqual(['CI']);
    expect(run.branches).toEqual(['main']);
    const checkout = build.steps!.find((s) => s.uses?.startsWith('actions/checkout'));
    expect(checkout, 'a checkout step').toBeDefined();
    expect(checkout!.with?.ref).toBe(SHA);
  });

  it('records the commit in version.json, the job summary and the job outputs, and refuses another checkout', () => {
    const build_ = build.steps!.find((s) => s.run === 'npm run build');
    expect(build_?.env?.BUILD_COMMIT).toBe(SHA);
    const version = build.steps!.find((s) => s.id === 'version')!;
    expect(version.env?.WANT).toBe(SHA);
    expect(version.run).toContain('git rev-parse HEAD');
    expect(version.run).toMatch(/\[ "\$sha" != "\$WANT" \][^\n]*exit 1/);
    expect(version.run).toContain('GITHUB_STEP_SUMMARY');
    expect(version.run).toContain('sha=$sha');
  });

  it('has the verify job compare the live commit with that sha', () => {
    const check = verify.steps!.find((s) => s.run?.includes('live commit'))!;
    expect(check.env?.SHA).toBe('${{ needs.build.outputs.sha }}');
    expect(check.run).toContain('jq -r .commit');
    expect(check.run).toMatch(/\[ -n "\$SHA" \] && \[ "\$live" = "\$SHA" \]/);
    expect(check.run).toMatch(/for check in [^;]*\bcommit\b[^;]*; do/);
  });
});

describe('nightly.yml (M10-R4)', () => {
  const wf = workflow('../../.github/workflows/nightly.yml');
  const series = wf.jobs['strength-m5b']!.strategy!.matrix.series!;

  /** Every `it(...)` title of the strength file, with its describe's title in front (what `-t` matches). */
  const src = read('../../ai/test/strength-warlord.test.ts');
  const describeTitle = /describe\(\s*'([^']+)'/.exec(src)![1]!;
  const titles = [...src.matchAll(/\bit(?:\.runIf\([^)]*\))?\(\s*[`']([^`']+)[`']/g)].map(
    (m) => `${describeTitle} ${m[1]!}`,
  );

  it('finds the six tests of the strength file', () => {
    expect(titles).toHaveLength(6);
  });

  it.each(series.map((s) => [s.name, s.filter] as const))(
    'the %s job filter ("%s") selects exactly one test',
    (name, filter) => {
      const hits = titles.filter((t) => new RegExp(filter).test(t));
      expect(hits, `${name}: ${filter} matched ${hits.length} tests`).toHaveLength(1);
    },
  );

  it('gives every series a time limit, the Emperor report the shortest, and its test a smaller guard', () => {
    for (const s of series) expect(s.minutes, s.name).toBeGreaterThan(0);
    const emperor = series.find((s) => s.name === 'emperor')!;
    expect(emperor.minutes).toBeLessThanOrEqual(150);
    expect(wf.jobs['strength-m5b']!['timeout-minutes']).toBe('${{ matrix.series.minutes }}');
    const guard = /emperor: FULL_TIMEOUT\((\d+)\)/.exec(src)![1]!;
    expect(Number(guard)).toBeLessThan(emperor.minutes);
  });
});
