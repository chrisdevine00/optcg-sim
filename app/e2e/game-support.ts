/** Helpers for the M3 board flows: start a game, read the decision, and play a whole game. */
import { expect, type Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const IMAGES = /https:\/\/(optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev)\/.*/;

/** Tests never touch the network or Bandai art: a generated 1×1 PNG stands in. */
export async function serveArt(page: Page) {
  await page.route(IMAGES, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
}

export async function startGame(page: Page, query: string) {
  await serveArt(page);
  await page.goto(`./play?${query}&start=1`);
  await expect(page.locator('#decision')).toBeVisible({ timeout: 15_000 });
}

export const decisionKind = (page: Page) => page.locator('#decision').getAttribute('data-kind');

/** Waits until the screen's player owes a decision (or the game is over); returns its kind. */
export async function nextDecision(page: Page, timeout = 30_000): Promise<string> {
  const t0 = Date.now();
  for (;;) {
    const curtain = page.locator('.curtain button');
    if (await curtain.isVisible().catch(() => false)) await curtain.click();
    const k = await decisionKind(page);
    if (k && k !== 'waiting' && k !== 'none') return k;
    if (Date.now() - t0 > timeout) throw new Error(`No decision within ${timeout} ms (last: ${k})`);
    await page.waitForTimeout(40);
  }
}

/** One Main Phase: play what is affordable, give DON!! to the Leader, attack the Leader with all. */
export async function playMainPhase(page: Page) {
  // Play the first playable card, at most twice.
  for (let n = 0; n < 2; n++) {
    const card = page.locator('[data-zone="hand"][data-glyph="play"]').first();
    if (!(await card.count())) break;
    await card.click();
    const play = page.getByRole('menuitem', { name: /^▶ Play/ });
    if (!(await play.count())) {
      await page.keyboard.press('Escape');
      break;
    }
    await play.click();
    await nextDecision(page);
    if ((await decisionKind(page)) === 'choose') await resolveChoose(page);
    if ((await decisionKind(page)) !== 'main') return;
  }
  // DON!! mode: give every active DON!! to the Leader.
  const row = page.locator('[data-zone="my-row"].rowbtn.legal, .costarea .rowbtn.legal').first();
  if (await row.count()) {
    await row.click();
    const leader = page.locator('[data-zone="my-row"].bc-leader');
    for (let i = 0; i < 12; i++) {
      if ((await leader.getAttribute('data-glyph')) !== 'don') break;
      await leader.click();
    }
    if ((await page.locator('#decision').getAttribute('data-mode')) === 'don')
      await page.locator('#don-done').click();
  }
  // Attack the Leader with everything that can.
  for (let n = 0; n < 6; n++) {
    if ((await decisionKind(page)) !== 'main') return;
    const attacker = page.locator('[data-glyph="attack"]').first();
    if (!(await attacker.count())) break;
    await attacker.click();
    // The Leader if it can be attacked, else a rested Character ([Rush: Character] cannot hit Leaders).
    const leader = page.locator('[data-zone="opp-row"].bc-leader[data-glyph="target"]');
    const target = (await leader.count())
      ? leader
      : page.locator('[data-zone="opp-chars"][data-glyph="target"]').first();
    if (!(await target.count())) {
      await page.keyboard.press('Escape');
      break;
    }
    await target.click();
    await page.locator('#confirm-attack').click();
    await nextDecision(page);
  }
  if ((await decisionKind(page)) === 'main') await page.locator('#endturn-btn').click();
}

export async function resolveChoose(page: Page) {
  const opt = page.locator('#decision .opts button').first();
  if (await opt.count()) await opt.click();
  // Card picks commit with Done; a named option (a mode, a DON!! location) acts on click.
  const done = page.locator('#choose-done');
  if (
    (await decisionKind(page)) === 'choose' &&
    (await done.count()) &&
    (await done.getAttribute('aria-disabled')) !== 'true'
  )
    await done.click();
}

/** Plays a whole game from the screen's side(s): every decision, until the game ends. */
export async function playToEnd(page: Page, maxDecisions = 2000) {
  for (let i = 0; i < maxDecisions; i++) {
    const k = await nextDecision(page);
    switch (k) {
      case 'over':
        return;
      case 'chooseFirst':
        await page.locator('#first-btn').click();
        break;
      case 'mulligan':
        await page.locator('#keep-btn').click();
        break;
      case 'main':
        await playMainPhase(page);
        break;
      case 'block':
      case 'counter':
        // "Take the hit" is always on offer in a defence (UX-R2).
        await expect(page.locator('#take-hit')).toBeVisible();
        await page.locator('#take-hit').click();
        break;
      case 'trigger':
        await page.locator('#trigger-hand').click();
        break;
      case 'choose':
        await resolveChoose(page);
        break;
      case 'optional':
        // Card effects (M4a): decline optional effects, so the game is decided by the base rules.
        await page.locator('#skip-btn').click();
        break;
      case 'order':
        await page.locator('#decision .dec-list .opt').first().click();
        break;
      default:
        throw new Error(`Unexpected decision ${k}`);
    }
    await page.waitForTimeout(20);
  }
  throw new Error('The game did not end');
}
