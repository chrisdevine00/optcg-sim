/**
 * Which per-card test files a push runs (PLAN §2a M6b-0): the tests of the cards it changed. The full
 * card suite runs nightly and whenever a push touches anything every card depends on.
 *
 * A per-card test file is one under `engine/test/cards/` or `engine/test/independent/cards/` whose
 * name starts with a card number (`OP17-039.test.ts`, `OP17-039-blocker.test.ts`). Every other test
 * file always runs.
 */

export const CARD_TEST_DIRS = ['engine/test/cards/', 'engine/test/independent/cards/'];
const ID_FILE = /(?:^|\/)([A-Z]+\d*-\d{3})[^/]*\.test\.tsx?$/;
const ID_PATH = /(?:^|\/)([A-Z]+\d*-\d{3})[^/]*$/;

/** Changes that can alter any card's behaviour or tests: run every card test. */
const EVERYTHING = [
  /^engine\/src\//,
  /^cards\/src\//,
  // Card data, except the reports a scripting push regenerates (coverage, play frequency).
  /^cards\/data\/(?!coverage-report\.json$|play-frequency\.json$)/,
  /^cards\/format\//,
  // The loader; not the generated registry or set indexes, which every new script changes.
  /^cards\/effects\/index\.ts$/,
  /^engine\/test\/(support|fixtures)\//,
  /^engine\/test\/(independent\/)?cards\/[^/]*\.ts$/, // shared kits beside the card tests
  /^engine\/test\/(independent\/)?cards\/.*(kit|support|helpers?)\.ts$/,
  /^test-setup\//,
  /^vitest\.config\.ts$/,
  /^package(-lock)?\.json$/,
  /^tsconfig/,
];

/** The card number a per-card test file tests, or null for any other file. */
export function cardOfTestFile(path: string): string | null {
  if (!CARD_TEST_DIRS.some((d) => path.startsWith(d))) return null;
  return ID_FILE.exec(path)?.[1] ?? null;
}

export interface Selection {
  /** Run every per-card test file. */
  all: boolean;
  /** Why everything runs, when it does. */
  reason?: string;
  /** Card numbers whose tests run (when not all). */
  cards: string[];
  /** Per-card test files to leave out of this run (when not all). */
  skip: string[];
}

/**
 * `changed`: paths changed since the base (repo-relative). `testFiles`: every test file. A changed
 * card is one whose script, override or test file changed.
 */
export function selectCardTests(
  changed: readonly string[] | null,
  testFiles: readonly string[],
): Selection {
  if (changed === null)
    return { all: true, reason: 'no base to compare with', cards: [], skip: [] };
  const wide = changed.find((p) => EVERYTHING.some((re) => re.test(p)) && !cardOfTestFile(p));
  if (wide) return { all: true, reason: `${wide} changed`, cards: [], skip: [] };
  const cards = new Set<string>();
  for (const p of changed) {
    const fromTest = cardOfTestFile(p);
    if (fromTest) cards.add(fromTest);
    else if (/^cards\/(effects|overrides)\//.test(p)) {
      const id = ID_PATH.exec(p)?.[1];
      if (id) cards.add(id);
    }
  }
  const skip = testFiles.filter((f) => {
    const id = cardOfTestFile(f);
    return id !== null && !cards.has(id);
  });
  return { all: false, cards: [...cards].sort(), skip: skip.sort() };
}
