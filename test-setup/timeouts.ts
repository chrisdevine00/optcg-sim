/**
 * Vitest setup: test timeouts are hang guards, not performance bounds (docs/runbooks/testing.md).
 *
 * A file that says `vi.setConfig({ testTimeout: 120_000 })` meant "this finishes in about 30 s on
 * a laptop, and a hang should fail rather than wait for the job cap". Under load (a CI runner, or
 * several suites at once) the same test takes three or four times as long, and a timeout set at
 * twice the idle time flips. Every `testTimeout` set through `vi.setConfig` is therefore
 * multiplied by `TEST_TIMEOUT_SCALE` (default 2), so those files keep their idle-machine numbers
 * and gain the headroom here, in one place. A test that really hangs still fails, a few minutes
 * later. `vitest.config.ts` sets the default for the files that set none.
 */
import { vi } from 'vitest';

export const TEST_TIMEOUT_SCALE = Number(process.env.TEST_TIMEOUT_SCALE ?? 2);

const setConfig = vi.setConfig.bind(vi);
vi.setConfig = (config) =>
  setConfig(
    config.testTimeout === undefined
      ? config
      : { ...config, testTimeout: config.testTimeout * TEST_TIMEOUT_SCALE },
  );
