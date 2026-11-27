/**
 * M10 WP0: the performance and visual measurements are off unless their switch is set, so a plain
 * `npx playwright test` (and CI's per-push run) does none of that work. The switches are PERF=1
 * (frames) and VISUAL=1 (pixel baselines); only their own scripts may set them. Revert: remove the
 * `test.skip(!process.env.PERF…)` line from the frame spec, or put PERF=1 into the default e2e
 * script or the Playwright config, and a test here fails.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

describe('perf and visual switches default off', () => {
  it('the frame spec skips itself without PERF', () => {
    expect(read('app/e2e/perf-frames.spec.ts')).toMatch(/test\.skip\(!process\.env\.PERF,/);
  });
  it('the Playwright config does not set either switch', () => {
    const cfg = read('playwright.config.ts');
    expect(cfg).not.toMatch(/process\.env\.(PERF|VISUAL)\s*=/);
    expect(cfg).not.toMatch(/\b(PERF|VISUAL)\s*:\s*['"]1['"]/);
  });
  it('only the perf and visual scripts set them', () => {
    const setting = Object.entries(pkg.scripts)
      .filter(([, cmd]) => /\b(PERF|VISUAL)=1/.test(cmd))
      .map(([name]) => name)
      .sort();
    expect(setting).toEqual(['perf:frames', 'test:visual']);
    for (const name of ['test', 'test:e2e', 'test:ci', 'build'])
      expect(pkg.scripts[name], name).not.toMatch(/PERF|VISUAL/);
  });
  it('the perf workflow runs on a schedule and dispatch only, never on push', () => {
    const wf = read('.github/workflows/perf.yml');
    expect(wf).toMatch(/schedule:/);
    expect(wf).toMatch(/workflow_dispatch:/);
    expect(wf).not.toMatch(/\n\s*push:/);
    expect(wf).not.toMatch(/\n\s*pull_request:/);
  });
});
