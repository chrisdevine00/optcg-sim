/**
 * M10 WP4: every route and the states that matter, as data the audit walks (`m10-audit.spec.ts`) and
 * `app/test/route-coverage.test.ts` checks against `App.tsx` and `routes/m9.ts` (a route with no entry
 * fails that test; so does an entry no route handles).
 *
 * This file is imported by vitest as well as Playwright, so it holds data and lazy imports only: a
 * `setup` loads the e2e helpers inside itself, never at the top of the module.
 */
import type { Page, TestInfo } from '@playwright/test';

export interface AuditEntry {
  /** Unique, kebab-case: used in file names and the report. */
  name: string;
  /** The URL path this entry covers, without query: the coverage test matches it to the routes. */
  path: string;
  /** Query string appended on load, when the route needs one. */
  query?: string;
  /** The level-one heading the page shows once it is ready. */
  heading: string | RegExp;
  /** Reaches the state when loading `path` is not enough. Runs after the first navigation (or instead of it with `own`). */
  setup?: (page: Page, info: TestInfo) => Promise<void>;
  /** `setup` does its own navigation. */
  own?: boolean;
  /** A board (full-screen, two-dimensional content): zoom checks the readable channels, not page scroll. */
  board?: boolean;
  /** The heading does not take focus on a first load: the state is a dialog or a state reached by acting. */
  noFocus?: string;
  /** The path is deliberately handled by no route (the not-found page). */
  unknown?: boolean;
  /**
   * Findings reported, not failed: a severity-1 defect with a BACKLOG line, so the run stays green and the
   * generated report still lists it. Each needs a reason; a finding that is not listed here fails.
   */
  known?: { match: RegExp; why: string }[];
  /** Skip the run of the layers that need the app's own routing (offline shells, forced errors). */
  note?: string;
}

/** The eight states that also get zoom, text spacing, forced colours, reduced motion and colour vision. */
export const AUDIT_DEEP = new Set([
  'home',
  'play-setup',
  'board-target',
  'board-defend',
  'decks-builder',
  'cards-inspector',
  'review-flag',
  'settings',
]);

/** The three states captured under the four colour-vision emulations (accessibility §6.1). */
export const AUDIT_VISION = new Set(['board-target', 'board-defend', 'review-flag']);

export const ROCKS = [
  '1 OP17-039',
  '3 OP08-051',
  '4 OP17-040',
  '1 OP17-042',
  '3 OP17-044',
  '4 OP17-045',
  '4 OP17-046',
  '4 OP17-048',
  '4 OP17-049',
  '3 OP17-050',
  '4 OP17-052',
  '4 OP17-054',
  '4 OP17-055',
  '4 OP17-056',
  '4 OP17-118',
].join('\n');

async function game() {
  return import('../game-support.ts');
}

/** A board position in the lethal scenario: your Main Phase. */
async function explore(page: Page) {
  const g = await game();
  await g.startGame(page, 'scenario=lethal&speed=4&aibudget=iterations');
  await g.nextDecision(page);
}

async function target(page: Page) {
  await explore(page);
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').waitFor();
}

async function count(page: Page) {
  await explore(page);
  await page.locator('[data-zone="my-row"].bc-leader').focus();
  await page.keyboard.press('+');
  await page.getByRole('dialog', { name: /Give DON!!/ }).waitFor();
}

async function defend(page: Page) {
  const g = await game();
  await g.startGame(page, 'scenario=defend&speed=4&aibudget=iterations');
  await g.nextDecision(page);
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  await g.nextDecision(page);
}

/** Queen played from the M3 position with every DON!! active: a pick, then an order choice. */
async function playQueen(page: Page): Promise<void> {
  const { A11Y_SCENARIOS } = await import('../../src/play/setup/a11y-scenarios.ts');
  const g = await game();
  const spec = structuredClone(A11Y_SCENARIOS['a11y-m3']!);
  spec.p1.costArea = { active: 10, rested: 0 };
  const q = `scenario=json:${Buffer.from(JSON.stringify(spec)).toString('base64url')}&speed=step&aibudget=iterations`;
  await g.startGame(page, q);
  await g.nextDecision(page);
  await page.locator('[data-zone="hand"][data-item]').nth(4).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: /^Play/ }).press('Enter');
}

/** Answers decisions until the wanted one is on screen: the pick (a Candidates group) or the order choice. */
async function drive(page: Page, until: 'pick' | 'order') {
  const g = await game();
  for (let i = 0; i < 20; i++) {
    const k = await g.nextDecision(page);
    const candidates = page.getByRole('group', { name: 'Candidates' });
    if (until === 'order' && k === 'order') return;
    if (until === 'pick' && k === 'choose' && (await candidates.count())) return;
    if (k === 'optional') await page.locator('#use-btn').click();
    else if (k === 'choose') {
      const options = page.getByRole('group', { name: 'Options' });
      if (await options.count()) await options.locator('button').first().click();
      else {
        await candidates.locator('button:not([aria-disabled])').first().click();
        await page.locator('#choose-done').click();
      }
    } else if (k === 'main') break;
    await page.waitForTimeout(60);
  }
  throw new Error(`the ${until} decision never came`);
}

async function pick(page: Page) {
  await playQueen(page);
  await drive(page, 'pick');
}

async function order(page: Page) {
  await playQueen(page);
  await drive(page, 'order');
}

async function builder(page: Page) {
  const { serveArt } = await game();
  await serveArt(page);
  await page.goto('./decks');
  await page.getByRole('button', { name: 'New deck' }).click();
  await page.locator('.builder').waitFor({ timeout: 20_000 });
}

async function builderWithDeck(page: Page) {
  await builder(page);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#import-text').fill(ROCKS);
  await page.getByRole('button', { name: /^Import \d+ cards$/ }).click();
  await page.locator('#import-text').waitFor({ state: 'detached' });
}

async function review(page: Page) {
  const { load, planted, status } = await import('../review-m8-support.ts');
  const g = planted()['missed-lethal']!;
  await load(page, [g], `./reviews/${g.id}`);
  await status(page).waitFor({ timeout: 45_000 });
  await page
    .getByText(/\d flags?/)
    .first()
    .waitFor({ timeout: 45_000 });
}

async function reviewStudy(page: Page) {
  await review(page);
  await page
    .getByRole('listbox', { name: /^Flags/ })
    .getByRole('option')
    .first()
    .click();
  await page.getByRole('listbox', { name: /^Flags/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('study-rail').waitFor();
}

async function drill(page: Page, id: string) {
  const { noArt } = await import('../m9-support.ts');
  await noArt(page);
  await page.goto(`drills/${id}/run?source=bank&count=5&sid=e2e-audit-${id}`);
  await page.locator('h1').first().waitFor({ timeout: 30_000 });
}

/** The Settings chunk is replaced by a module that throws, as the release spec does. */
async function errorPage(page: Page) {
  await page.route('**/assets/SettingsRoute-*.js', (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: 'export default function Settings() { throw new Error("audit: forced render failure"); }',
    }),
  );
  await page.goto('./');
  await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
}

export const AUDIT_ROUTES: AuditEntry[] = [
  { name: 'home', path: '/', heading: 'OPTCG Sim' },
  { name: 'play-setup', path: '/play', heading: 'New game' },
  {
    name: 'board-explore',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'the board has no page heading to move to; the decision panel holds focus',
    own: true,
    setup: explore,
  },
  {
    name: 'board-target',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a state reached by acting in a game',
    own: true,
    known: [
      {
        match: /text spacing clips div\.rail/,
        why: 'Under the 1.4.12 override the primary button label wraps to three lines and the button ends 4 px past the rail; the label stays whole and visible, only its bottom border is cut (severity 1; BACKLOG, board footer height is set by the layout).',
      },
    ],
    setup: target,
  },
  {
    name: 'board-count',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a dialog opened by a key',
    own: true,
    setup: count,
  },
  {
    name: 'board-pick',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a state reached by acting in a game',
    own: true,
    setup: pick,
  },
  {
    name: 'board-order',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a state reached by acting in a game',
    own: true,
    setup: order,
  },
  {
    name: 'board-defend',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a state reached by acting in a game',
    own: true,
    known: [
      {
        match: /text spacing clips div\.rail/,
        why: 'Under the 1.4.12 override the primary button label wraps to three lines and the button ends 4 px past the rail; the label stays whole and visible, only its bottom border is cut (severity 1; BACKLOG, board footer height is set by the layout).',
      },
    ],
    setup: defend,
  },
  {
    name: 'shortcut-sheet',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a dialog opened by a key',
    own: true,
    setup: async (page) => {
      await explore(page);
      await page.keyboard.press('?');
      await page.getByRole('dialog', { name: 'Keyboard shortcuts' }).waitFor();
    },
  },
  {
    name: 'coach-panel',
    path: '/play',
    heading: /./,
    board: true,
    noFocus: 'a panel opened by a key',
    own: true,
    setup: async (page) => {
      const g = await game();
      await g.startGame(page, 'scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations');
      await g.nextDecision(page);
      await page.keyboard.press('h');
      await page.locator('.coach[data-mode="open"]').waitFor();
      await page.locator('.coach-hint[data-hint="ready"]').waitFor({ timeout: 30_000 });
    },
  },
  {
    name: 'tutorial',
    path: '/tutorial',
    query: 'restart=1',
    heading: /./,
    board: true,
    noFocus: 'the tutorial card, not a heading, takes focus (flows F2)',
    own: true,
    setup: async (page) => {
      const { serveArt } = await game();
      await serveArt(page);
      await page.goto('./tutorial?restart=1');
      await page.getByTestId('tutorial-card').waitFor({ timeout: 30_000 });
      await page.locator('#decision').waitFor();
    },
  },
  { name: 'learn', path: '/learn', heading: /./ },
  { name: 'learn-lesson', path: '/learn/L05-block-and-counter', heading: /./ },
  { name: 'meta', path: '/meta', heading: /./ },
  { name: 'meta-leader', path: '/meta/OP17-039', heading: /./ },
  { name: 'meta-matchups', path: '/meta/matchups', heading: /./ },
  { name: 'drills', path: '/drills', heading: /./ },
  { name: 'drill-start', path: '/drills/mulligan', heading: /./ },
  {
    name: 'drill-mulligan',
    path: '/drills/mulligan/run',
    query: 'source=bank&count=5&sid=e2e-audit-mulligan',
    heading: /./,
    board: true,
    own: true,
    setup: (page) => drill(page, 'mulligan'),
  },
  {
    name: 'drill-lethal',
    path: '/drills/lethal/run',
    heading: /./,
    board: true,
    noFocus: 'the lethal item is a board',
    own: true,
    setup: async (page) => {
      await drill(page, 'lethal');
      await page.getByRole('button', { name: /Submit turn/ }).waitFor({ timeout: 30_000 });
    },
  },
  {
    name: 'drill-counter',
    path: '/drills/counter/run',
    heading: /./,
    board: true,
    noFocus: 'the item is a board: focus is on its decision panel',
    own: true,
    setup: (page) => drill(page, 'counter'),
  },
  {
    name: 'drill-don',
    path: '/drills/don/run',
    heading: /./,
    board: true,
    noFocus: 'the item is a board: focus is on its decision panel',
    own: true,
    setup: (page) => drill(page, 'don'),
  },
  { name: 'rules', path: '/rules', heading: /./ },
  { name: 'rules-entry', path: '/rules/cr/7-1-4-1', heading: /./ },
  {
    name: 'rules-show-me',
    path: '/rules/cr/7-1-4-1/show',
    heading: /./,
    board: true,
    noFocus: 'the demo is a board: focus is on its decision panel',
    own: true,
    setup: async (page) => {
      const { noArt } = await import('../m9-support.ts');
      await noArt(page);
      await page.goto('rules/cr/7-1-4-1/show');
      await page.locator('h1').first().waitFor({ timeout: 30_000 });
    },
  },
  { name: 'progress', path: '/progress', heading: /./ },
  { name: 'decks', path: '/decks', heading: /./ },
  {
    name: 'decks-builder',
    path: '/decks/a-saved-deck',
    heading: /./,
    noFocus: 'the builder opens from a button on the decks page',
    own: true,
    setup: builderWithDeck,
  },
  {
    name: 'decks-import',
    path: '/decks/a-saved-deck',
    heading: /./,
    noFocus: 'a dialog',
    own: true,
    setup: async (page) => {
      await builder(page);
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      await page.locator('#import-text').waitFor();
    },
  },
  {
    name: 'decks-export',
    path: '/decks/a-saved-deck',
    heading: /./,
    noFocus: 'a dialog',
    own: true,
    setup: async (page) => {
      await builderWithDeck(page);
      await page.getByRole('button', { name: 'Export' }).click();
      await page.locator('#export-text').waitFor();
    },
  },
  { name: 'cards', path: '/cards', heading: /./ },
  {
    name: 'cards-inspector',
    path: '/cards',
    query: 'card=OP17-087',
    heading: /./,
    noFocus: 'the inspector dialog holds focus',
    own: true,
    setup: async (page) => {
      const { serveArt } = await game();
      await serveArt(page);
      await page.goto('./cards?card=OP17-087');
      await page.getByRole('dialog', { name: 'Nico Robin' }).waitFor({ timeout: 30_000 });
    },
  },
  { name: 'reviews', path: '/reviews', heading: /./ },
  {
    name: 'review-flag',
    path: '/reviews/missed-lethal',
    heading: /./,
    noFocus: 'the flag list holds focus',
    own: true,
    setup: review,
  },
  {
    name: 'review-study',
    path: '/reviews/missed-lethal',
    heading: /./,
    board: true,
    noFocus: 'Study is the board',
    own: true,
    setup: reviewStudy,
  },
  { name: 'settings', path: '/settings', heading: /./ },
  { name: 'about', path: '/about', heading: 'About' },
  {
    name: 'not-found',
    path: '/nope/nope',
    heading: 'Page not found',
    unknown: true,
  },
  {
    name: 'error-page',
    path: '/settings',
    heading: 'Something went wrong on this page',
    own: true,
    setup: errorPage,
    note: 'Settings chunk forced to throw, as in m10-release.spec.ts',
  },
];
