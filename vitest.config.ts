import { readFileSync } from 'node:fs';
import { configDefaults, defineConfig } from 'vitest/config';

// `npm run test:ci` leaves out the per-card tests of cards a push did not change (M6b-0).
const skip: string[] = process.env.CARD_TESTS_SKIP
  ? (JSON.parse(readFileSync(process.env.CARD_TESTS_SKIP, 'utf8')) as string[])
  : [];

export default defineConfig({
  test: {
    include: ['{engine,cards,ai,app}/{src,test}/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, ...skip],
    environment: 'node',
    // Every effect script, loaded once per test file (scripts load per set in the app; M6b-0).
    setupFiles: ['./test-setup/scripts.ts'],
  },
});
