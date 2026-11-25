/**
 * M7 WP6: the tutorial's timing log never leaves the browser (usability-plan §7.1), enforced by the
 * lint rules: no `navigator.sendBeacon` anywhere in `app/src`, and no `fetch` outside the art
 * loader and the service worker.
 */
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const root = new URL('../../', import.meta.url).pathname;

async function rules(filePath: string, code: string): Promise<string[]> {
  const eslint = new ESLint({ cwd: root });
  const [r] = await eslint.lintText(code, { filePath: root + filePath });
  return r!.messages.map((m) => m.ruleId ?? 'parse-error');
}

const FETCH = 'export const a = () => fetch("/x");\n';
const BEACON = 'export const b = () => navigator.sendBeacon("/x", "y");\n';

describe('no network from the tutorial', () => {
  it('bans fetch in the tutorial and the rest of the app', async () => {
    expect(await rules('app/src/tutorial/probe.ts', FETCH)).toContain('no-restricted-globals');
    expect(await rules('app/src/routes/probe.ts', FETCH)).toContain('no-restricted-globals');
  });

  it('allows fetch in the art loader and the service worker', async () => {
    expect(await rules('app/src/art/probe.ts', FETCH)).not.toContain('no-restricted-globals');
    expect(await rules('app/src/sw.ts', FETCH)).not.toContain('no-restricted-globals');
  });

  it('bans sendBeacon everywhere, the art loader and the service worker included', async () => {
    for (const f of ['app/src/tutorial/probe.ts', 'app/src/art/probe.ts', 'app/src/sw.ts'])
      expect(await rules(f, BEACON), f).toContain('no-restricted-properties');
  });
});
