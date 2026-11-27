import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

// Tests run against the pinned meta (M6b-0): a weekly meta PR changes docs/research/meta-lists.json, and
// the AI's opponent model, lethal certainty and explanations read it. Tests that check the live file
// itself read it from disk (engine/test/rules/deck-format.test.ts, cards/test/decklist.test.ts).
export const PINNED_META = {
  find: /^(?:\.\.\/)+docs\/research\/meta-lists\.json$/,
  replacement: fileURLToPath(new URL('./ai/test/fixtures/meta-lists.pinned.json', import.meta.url)),
};

// `npm run test:ci` leaves out the per-card tests of cards a push did not change (M6b-0).
const skip: string[] = process.env.CARD_TESTS_SKIP
  ? (JSON.parse(readFileSync(process.env.CARD_TESTS_SKIP, 'utf8')) as string[])
  : [];

export default defineConfig({
  resolve: { alias: [PINNED_META] },
  test: {
    include: ['{engine,cards,ai,app}/{src,test}/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, ...skip],
    environment: 'node',
    // Every effect script, loaded once per test file (scripts load per set in the app; M6b-0).
    setupFiles: ['./test-setup/scripts.ts', './test-setup/timeouts.ts'],
    // A hang guard for the files that set no `testTimeout` of their own (test-setup/timeouts.ts).
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
