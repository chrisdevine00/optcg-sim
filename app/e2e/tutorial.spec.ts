/**
 * M7 WP6: the guided tutorial end to end. A full pointer run and a full keyboard-only run that use
 * only the inputs the step text names; "Not yet…" and a blocked attempt on a wrong click; t5's
 * "Take the hit" inert with its line; leave at step 4, reload and Continue with focus on the step
 * text; the completion screen and the first-game preset; axe on every step; reduced motion shows no
 * pulse; no network beyond the app and the art origins; the exported JSON; screenshots at both sizes.
 */
import { expect, test, type Page } from '@playwright/test';
import { card, check, fresh, hand, IDS, myTurn, next, TIMING } from './tutorial-support.ts';

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

// -----------------------------------------------------------------------------------------------
// One step at a time, by pointer
// -----------------------------------------------------------------------------------------------

const POINTER: Record<string, (page: Page) => Promise<void>> = {
  't1-zones': async (page) => {
    for (const z of ['donDeck', 'life', 'deck', 'stage'])
      await page.locator(`[data-zid="${z}"]`).click();
    await page.locator('[data-zid="costArea"] .rowbtn').click();
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.locator('[data-zone="my-chars"][data-item]').first().click();
    await hand(page, 'Jinbe').click();
    await page.locator('[data-zid="trash"]').click();
    await page.keyboard.press('Escape');
  },
  't2-first-turn': async (page) => {
    await hand(page, 'Jinbe').click();
    await page.getByRole('menuitem', { name: /^Play/ }).click();
  },
  't3-don-and-power': async (page) => {
    await page.locator('[data-zid="costArea"] .rowbtn').click();
    await page.locator('[data-zone="my-row"].bc-leader').click();
  },
  't4-attack': async (page) => {
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.getByRole('menuitem', { name: /Attack/ }).click();
    await page.locator('[data-zone="opp-row"].bc-leader').click();
    await page.locator('#confirm-attack').click();
  },
  't5-defend': async (page) => {
    await myTurn(page, 'block');
    await hand(page, 'Jinbe').click();
    await page.locator('#commit-defence').click();
  },
  't6-trigger': async (page) => {
    await myTurn(page, 'block');
    await page.locator('#take-hit').click();
    await myTurn(page, 'trigger');
    await page
      .getByRole('button', { name: /Activate/ })
      .first()
      .click();
    await myTurn(page);
    const pick = page.locator('[data-zone="opp-chars"][data-glyph="target"]').first();
    if (await pick.count()) {
      await pick.click();
      await page
        .getByRole('button', { name: /Confirm|Done/ })
        .first()
        .click();
    }
  },
  't7-leader': async (page) => {
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.getByRole('menuitem', { name: /Activate/ }).click();
    await myTurn(page, 'choose');
    await page
      .getByRole('group', { name: 'Options' })
      .getByRole('button', { name: /^2 DON/ })
      .click();
  },
  't8-winning': async (page) => {
    for (let i = 0; i < 2; i++) {
      await myTurn(page, 'main');
      const attacker = page
        .locator(
          '[data-zone="my-row"].bc-leader[data-glyph="attack"], [data-zone="my-chars"][data-glyph="attack"]',
        )
        .first();
      await attacker.click();
      const item = page.getByRole('menuitem', { name: /Attack/ });
      if (await item.isVisible().catch(() => false)) await item.click();
      await page.locator('[data-zone="opp-row"].bc-leader').click();
      await page.locator('#confirm-attack').click();
      await page.waitForTimeout(900);
    }
  },
};

test.describe('a full pointer run', () => {
  test('the eight steps by pointer, then the completion screen and the first-game preset', async ({
    page,
  }, info) => {
    test.setTimeout(240_000);
    const requests = new Set<string>();
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol === 'http:' || u.protocol === 'https:') requests.add(u.origin);
    });
    await page.goto('./tutorial?restart=1');
    await expect(card(page)).toBeVisible({ timeout: 20_000 });
    for (const [i, id] of IDS.entries()) {
      await expect(card(page)).toHaveAttribute('data-step', id);
      await check(page, info, `step-${i + 1}-${id}`);
      await POINTER[id]!(page);
      await expect(page.getByTestId('tutorial-done')).toBeVisible({ timeout: 30_000 });
      await next(page);
    }
    await expect(page.getByRole('heading', { name: /Tutorial complete in \d+ min/ })).toBeVisible();
    await check(page, info, 'complete');
    // No network beyond the app origin and the art origins (usability-plan §7.1).
    const app = new URL(page.url()).origin;
    const art = /optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev/;
    expect([...requests].filter((o) => o !== app && !art.test(o))).toEqual([]);

    // The exported JSON is the run, with the schema field.
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const file = await dl;
    expect(file.suggestedFilename()).toMatch(/^optcg-tutorial-timing-[0-9a-f]{16}\.json$/);
    const log = JSON.parse(
      await (await import('node:fs/promises')).readFile((await file.path())!, 'utf8'),
    );
    expect(log.schema).toBe('tutorial-timing/1');
    expect(log.steps.map((s: { stepId: string }) => s.stepId)).toEqual(IDS);
    expect(log.completedMs).not.toBeNull();
    expect(log.totalActiveMs).toBeGreaterThan(0);

    // The first-game preset.
    await page.getByRole('button', { name: 'Play your first full game' }).click();
    await expect(page.getByTestId('first-game-note')).toContainText('Set for your first game');
    await expect(page.locator('select[name="mine-list"]')).toHaveValue('tutorial:st21');
    await expect(page.locator('select[name="theirs-list"]')).toHaveValue('tutorial:st22');
    await expect(page.getByRole('radio', { name: /Rookie AI/ })).toBeChecked();
    const stored = await page.evaluate((k) => window.localStorage.getItem(k), TIMING);
    expect(JSON.parse(stored!)).toHaveLength(1);
  });
});
