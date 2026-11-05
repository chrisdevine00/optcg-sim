import { expect, test, type Locator, type Page } from '@playwright/test';
import { A11Y_SCENARIOS } from '../src/play/setup/a11y-scenarios.ts';
import { nextDecision, startGame } from './game-support.ts';

/**
 * M3 screen-reader pass findings F1, F3, FF1 (docs/design/a11y-passes/m3-nvda-*.md): focus is never
 * left on <body> after a commit, the first Tab from the page top reaches the skip link, and each
 * assertive announcement is a fresh child node.
 */
const M3 = 'scenario=a11y-m3&speed=step';

const active = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return { tag: el?.tagName ?? '', id: el?.id ?? '' };
  });

async function notBody(page: Page, what: string) {
  // Focus may take a beat to land (the decision panel's own focus runs after 30 ms).
  await expect
    .poll(async () => (await active(page)).tag, { message: `focus after ${what}`, timeout: 2000 })
    .not.toMatch(/^(BODY|HTML)$/);
}

async function playFromMenu(page: Page, card: Locator) {
  await card.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: /^Play/ }).press('Enter');
}

/** Step pace: presses "Next move" and takes every hit until the human owes a Main Phase again. */
async function driveAiTurn(page: Page, focusNext: boolean) {
  for (let i = 0; i < 300; i++) {
    const k = await page.locator('#decision').getAttribute('data-kind');
    if (k === 'main') return;
    if (k === 'block' || k === 'counter') await page.locator('#take-hit').click();
    else if (k === 'trigger') await page.locator('#trigger-hand').click();
    else if (k === 'optional') await page.locator('#skip-btn').click();
    else if (await page.locator('#next-btn:not([aria-disabled="true"])').count()) {
      const next = page.locator('#next-btn');
      if (focusNext) await next.focus();
      await next.click();
    }
    await page.waitForTimeout(100);
  }
  throw new Error('The AI turn did not end');
}

test.describe('focus is never lost to the page body (accessibility §4.3)', () => {
  test('on load, the first Tab reaches the skip link, not the decision (F3)', async ({ page }) => {
    await startGame(page, M3);
    await nextDecision(page);
    await page.waitForTimeout(300);
    expect((await active(page)).id).not.toBe('decision-title');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to decision' })).toBeFocused();
  });

  test('playing from the action menu leaves focus on the page (F1)', async ({ page }) => {
    await startGame(page, M3);
    await nextDecision(page);
    await playFromMenu(page, page.locator('[data-zone="hand"][data-glyph="play"]').first());
    await notBody(page, 'Play');
  });

  test('Done on a pick and the order choice leave focus on the page (F1)', async ({ page }) => {
    // The M3 position with every DON!! active, so Queen can be played: its [On Play] pick, then
    // the two Kaido's DON!! -1 triggers ask for an order (script steps 13 and 14).
    const spec = structuredClone(A11Y_SCENARIOS['a11y-m3']!);
    spec.p1.costArea = { active: 10, rested: 0 };
    const q = `scenario=json:${Buffer.from(JSON.stringify(spec)).toString('base64url')}&speed=step`;
    await startGame(page, q);
    await nextDecision(page);
    await playFromMenu(page, page.locator('[data-zone="hand"][data-item]').nth(4));
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const k = await nextDecision(page);
      if (k === 'main') break;
      seen.add(k);
      await page.waitForTimeout(120);
      if (k === 'optional') await page.locator('#use-btn').click();
      else if (k === 'choose' && (await page.getByRole('group', { name: 'Options' }).count())) {
        // A DON!! class or a mode: one click answers it.
        await page.getByRole('group', { name: 'Options' }).locator('button').first().click();
        await notBody(page, 'an option');
      } else if (k === 'choose') {
        await page
          .getByRole('group', { name: 'Candidates' })
          .locator('button:not([aria-disabled])')
          .first()
          .click();
        await page.locator('#choose-done').focus();
        await page.keyboard.press('Enter');
        await notBody(page, 'Done');
      } else if (k === 'order') {
        await page.locator('#order-0').focus();
        await page.keyboard.press('Enter');
        await notBody(page, 'the order choice');
      } else throw new Error(`unexpected decision ${k}`);
    }
    expect(seen.has('choose')).toBe(true);
    expect(seen.has('order')).toBe(true);
  });

  test('the end of the AI turn leaves focus on the page (F1)', async ({ page }) => {
    await startGame(page, M3);
    await nextDecision(page);
    await page.keyboard.press('Tab');
    await page.locator('#decision-title').focus();
    await page.keyboard.press('e');
    await driveAiTurn(page, true);
    await notBody(page, 'the AI turn ended');
  });

  test('during the AI turn at Step pace, focus is on Next move, where `.` works (F15)', async ({
    page,
  }) => {
    await startGame(page, M3);
    await nextDecision(page);
    // End turn by keyboard: the button goes away with the Main Phase, and focus is rescued.
    await page.locator('#endturn-btn').focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => (await active(page)).id, { message: 'focus on Next move', timeout: 5000 })
      .toBe('next-btn');
    // `.` from there moves the AI on (the footer strip is role="application").
    const before = await page.locator('.log-list li').count();
    await expect(page.locator('#next-btn:not([aria-disabled="true"])')).toHaveCount(1, {
      timeout: 5000,
    });
    await page.keyboard.press('.');
    await expect.poll(() => page.locator('.log-list li').count()).toBeGreaterThan(before);
  });

  test('the pinned inspector is described by the card text itself, not a label (F7)', async ({
    page,
  }) => {
    await startGame(page, M3);
    await nextDecision(page);
    const card = page.locator('[data-zone="hand"][data-item]').first();
    await card.focus();
    await page.keyboard.press('i');
    const dialog = page.locator('[aria-describedby="dock-text-body"]');
    await expect(dialog).toHaveCount(1);
    const body = page.locator('#dock-text-body');
    await expect(body).not.toHaveAttribute('aria-label', /.*/);
    expect(((await body.textContent()) ?? '').trim().length).toBeGreaterThan(0);
  });

  test('each assertive announcement is a fresh child node, cleared after a second (FF1)', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await startGame(page, M3);
    await nextDecision(page);
    await page.evaluate(() => {
      const w = window as unknown as { __alerts: Node[] };
      w.__alerts = [];
      const region = document.getElementById('announce-assertive')!;
      new MutationObserver((ms) => {
        for (const m of ms) m.addedNodes.forEach((n) => w.__alerts.push(n));
      }).observe(region, { childList: true });
    });
    const region = page.locator('#announce-assertive');
    // Not role="alert": NVDA with Firefox speaks an alert only when it first appears.
    await expect(region).toHaveAttribute('aria-live', 'assertive');
    await expect(region).not.toHaveAttribute('role', 'alert');
    // End the turn; Rookie attacks more than once at Step pace. Take every hit.
    await page.locator('#decision-title').focus();
    await page.keyboard.press('e');
    await driveAiTurn(page, false);
    const r = await page.evaluate(() => {
      const nodes = (window as unknown as { __alerts: Node[] }).__alerts;
      return {
        count: nodes.length,
        distinct: new Set(nodes).size,
        texts: nodes.map((n) => n.textContent),
      };
    });
    // Each defence wrote one, and no write reused a node.
    expect(r.count).toBeGreaterThanOrEqual(2);
    expect(r.distinct).toBe(r.count);
    expect(r.texts.every((t) => /attacks/.test(t ?? ''))).toBe(true);
    // The last write is gone about a second later (F6b: no stale alert for a closing dialog).
    await expect(region.locator('p')).toHaveCount(0, { timeout: 3000 });
  });
});
