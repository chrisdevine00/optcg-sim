/**
 * M10 WP7, carried polish: the midline's activity text never meets the turn label (M5a-16), Setup's
 * layout holds still when the opponent changes and uses the width at 1920 (S1 note), the automation
 * line stays away from an invalid deck and a failed card load says so (N-4), the JSON importer
 * names what it skips (M6-11), and two small copy items. Both viewport projects run each test.
 *
 * Reverts, each failing its test: delete the midline's `max-width`; make `.setup` left-aligned
 * again; show the automation line beside a problem; restore the silent JSON clamp.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, serveArt, startGame } from './game-support.ts';

// The longest lines the AI's effects print (review m5a-rr1: 720p-mid-2.png, 720p-mid-4.png), plus
// the same shapes at the lengths a long card name gives them.
const LONGEST = [
  'Their hand: trash X.Drake (cost) · Draw 2',
  'Return 1 DON!! to the DON!! deck · Captain Eustass Kid gains a Blocker',
  'Opponent plays Charlotte Linlin (cost 10) and gives 2 rested DON!! to her; then attacks your Leader',
  'Trash 2 cards from your hand: Monkey.D.Luffy (OP05-060) K.O.s up to 1 of your opponent’s Characters with a cost of 5 or less',
  'Their Event: Gum-Gum Red Hawk, +4000 power during this battle; the Trigger is not activated',
];

/** Past the opening choices to the first Main Phase: the turn label and the stepper are both on show. */
async function toMain(page: Page) {
  await startGame(page, 'p1=OP17-039&p2=OP17-058&opp=rookie&seed=7&first=me&speed=4');
  for (let i = 0; i < 6 && !(await page.locator('.stepper').count()); i++) {
    const k = await nextDecision(page);
    if (k === 'chooseFirst') await page.locator('#first-btn').click();
    else if (k === 'mulligan') await page.locator('#keep-btn').click();
    else break;
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.stepper')).toBeVisible();
}

test.describe('M5a-16: the midline text and the turn label never intersect', () => {
  for (const turn of ['yours', 'theirs'] as const)
    test(`five long activity lines, on ${turn} turn, at both sizes`, async ({ page }, info) => {
      await toMain(page);
      if (turn === 'theirs') {
        await page.locator('#endturn-btn').click();
        await expect(page.locator('.turn-words.opp')).toBeVisible({ timeout: 30_000 });
      }
      for (const [i, text] of LONGEST.entries()) {
        // Planted and measured in one step, so the game cannot redraw the line in between.
        const g = await page.evaluate((t) => {
          const vis = document.querySelector<HTMLElement>('.mid-left .vis')!;
          vis.textContent = t;
          document.querySelector('.mid-left .sr-only')!.textContent = t;
          const box = (s: string) => {
            const r = document.querySelector<HTMLElement>(s)!.getBoundingClientRect();
            return { l: r.left, r: r.right };
          };
          return {
            mid: box('.midline'),
            left: box('.mid-left'),
            words: box('.turn-words'),
            stepper: box('.stepper'),
            // A clamp or an ellipsis is fine, a spill past the box is not.
            spills: vis.scrollWidth > vis.clientWidth + 1,
          };
        }, text);
        const hit = (a: { l: number; r: number }, b: { l: number; r: number }) =>
          a.l < b.r && b.l < a.r;
        expect(hit(g.left, g.words), `line ${i + 1}: text box meets the turn label`).toBe(false);
        expect(hit(g.left, g.stepper), `line ${i + 1}: text box meets the stepper`).toBe(false);
        expect(g.left.l, `line ${i + 1}`).toBeGreaterThanOrEqual(g.mid.l);
        expect(g.spills, `line ${i + 1}: text spills out of its box`).toBe(false);
        if (i === 3)
          await page
            .locator('.midline')
            .screenshot({ path: info.outputPath(`midline-${turn}-${info.project.name}.png`) });
      }
    });

  test('the full text stays in the accessible name', async ({ page }) => {
    await toMain(page);
    const long = LONGEST[3]!;
    await page.evaluate((t) => {
      document.querySelector('.mid-left .vis')!.textContent = t;
      document.querySelector('.mid-left .sr-only')!.textContent = t;
    }, long);
    await expect(page.locator('.mid-left')).toHaveAccessibleName(long);
  });
});

async function columns(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.setup-grid > .setup-col')].map(
      (c) => Math.round(c.getBoundingClientRect().width * 10) / 10,
    ),
  );
}

test.describe('Setup layout', () => {
  test.beforeEach(async ({ page }) => serveArt(page));

  test('no column changes width between the Pirate and the Warlord', async ({ page }) => {
    await page.goto('./play');
    await expect(page.getByRole('button', { name: /Start game|Loading cards/ })).toBeVisible();
    await page.getByLabel(/Pirate AI/).check();
    const pirate = await columns(page);
    await page.getByLabel(/Warlord AI/).check();
    const warlord = await columns(page);
    await page.getByLabel(/Emperor AI/).check();
    const emperor = await columns(page);
    expect(pirate).toHaveLength(3);
    expect(warlord).toEqual(pirate);
    expect(emperor).toEqual(pirate);
    // And the long line wraps inside its column: nothing pushes the page sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the page is centred with a maximum width at 1920 and fills 1280', async ({
    page,
  }, info) => {
    await page.goto('./play');
    await expect(page.locator('.setup-grid')).toBeVisible();
    const g = await page.evaluate(() => {
      const r = document.querySelector<HTMLElement>('.setup')!.getBoundingClientRect();
      return { l: r.left, r: r.right, w: window.innerWidth };
    });
    expect(g.r - g.l).toBeLessThanOrEqual(1200 + 1);
    if (g.w >= 1500) {
      // Equal space on both sides (within a scrollbar): not a strip on the right.
      expect(Math.abs(g.l - (g.w - g.r))).toBeLessThanOrEqual(20);
      expect(g.l).toBeGreaterThan(200);
    } else expect(g.r).toBeLessThanOrEqual(g.w);
    await page.screenshot({ path: info.outputPath(`setup-${info.project.name}.png`) });
  });

  test('beside an invalid deck the automation line is hidden; the deck’s problems stand alone', async ({
    page,
  }) => {
    await page.goto('./decks');
    await page.evaluate(() =>
      localStorage.setItem(
        'optcg.decks.v1',
        JSON.stringify([
          {
            id: 'saved:five',
            name: 'Five copies',
            leader: 'OP17-039',
            main: [...Array(50).fill('OP17-040')],
            format: 'standard',
            art: {},
            updatedAt: '2026-11-27T00:00:00Z',
          },
        ]),
      ),
    );
    await page.goto('./play?p1=saved:five&opp=rookie');
    await expect(page.getByTestId('deck-problems-mine')).toBeVisible();
    const auto = page.getByTestId('automation');
    await expect(auto).toContainText('The AI’s deck');
    await expect(auto).not.toContainText('Your deck');
  });
});

test.describe('a card load that fails', () => {
  test('says "Card unavailable" with a retry, never "Unknown card", and Retry recovers', async ({
    page,
  }) => {
    await serveArt(page);
    // The OP-17 chunk fails once; the retry gets it.
    let fails = 1;
    await page.route(/\/OP-17[^/]*\.js(\?.*)?$/, (route) => {
      if (fails-- > 0) return route.abort('failed');
      return route.continue();
    });
    await page.goto('./play?p1=OP17-039&opp=rookie');
    const un = page.getByTestId('deck-unavailable-mine');
    await expect(un).toBeVisible({ timeout: 20_000 });
    await expect(un).toContainText('Card unavailable (OP17-');
    await expect(page.locator('body')).not.toContainText('Unknown card');
    await expect(page.getByRole('button', { name: 'Start game' })).toBeDisabled();
    await un.getByRole('button', { name: 'Retry' }).click();
    await expect(un).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start game' })).toBeEnabled({ timeout: 20_000 });
  });
});

test.describe('the JSON importer names what it skips (M6-11)', () => {
  test('a count that is not a number is listed, counted among the problems, and left out', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto('./decks');
    await page.getByRole('button', { name: 'New deck' }).click();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    const json = JSON.stringify({
      leader: 'OP17-039',
      main: [
        { id: 'OP17-040', count: 4 },
        { id: 'OP17-041', count: 'x' },
        { id: 'OP17-042', count: 0 },
        { id: 'OP17-043', count: 2 },
      ],
    });
    await page.locator('#import-text').fill(json);
    const report = page.locator('.import-report');
    await expect(report).toContainText('Entry 2: count “x” is not a number, skipped');
    await expect(report).toContainText('Entry 3: count 0 is less than 1, skipped');
    await expect(page.locator('.import-summary')).toContainText('2 problems');
    await expect(page.getByRole('button', { name: 'Import 6 cards' })).toBeEnabled();
  });
});

test.describe('the card browser count copy', () => {
  test('with Automated only on it reads "463 automated of 2,799 cards"; off, as before', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto('./cards?auto=1');
    const cov = page.getByTestId('coverage');
    await expect(cov).toContainText(/^\d[\d,]* automated of [\d,]+ cards:/, { timeout: 20_000 });
    await page.goto('./cards');
    await expect(page.getByTestId('coverage')).toContainText(/of [\d,]+ cards here play fully/);
    await expect(page.getByTestId('coverage')).not.toContainText('automated of');
  });
});
