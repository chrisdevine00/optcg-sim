/**
 * M5a: playing the Pirate AI. A game to completion with "Why?" on its moves (flows F10), and the
 * AI turn's pacing at 1× (flows F21, board.md §5.2: a typical turn in 8 s or less, the time of the
 * player's own Block and Counter decisions excluded). The controller measures each AI turn and
 * writes it to the game's `data-ai-turns` attribute.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { decisionKind, nextDecision, playToEnd, startGame } from './game-support.ts';

const once = () => test.skip(test.info().project.name !== '720p', 'one pass is enough');

async function aiTurns(
  page: Page,
): Promise<{ turn: number; ms: number; speed: string; moves: number; thinkMs: number }[]> {
  const raw = (await page.locator('main.play').getAttribute('data-ai-turns')) ?? '';
  return raw
    .split(' ')
    .filter(Boolean)
    .map((x) => {
      const [turn, rest] = x.split(':');
      const [ms, tail] = rest!.split('@');
      const [speed, moves, thinkMs] = tail!.split('/');
      return {
        turn: Number(turn),
        ms: Number(ms),
        speed: speed!,
        moves: Number(moves),
        thinkMs: Number(thinkMs),
      };
    });
}

test.describe('M5a: the Pirate AI', () => {
  test('a game vs Pirate plays to completion, and its moves explain themselves', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startGame(page, 'scenario=late&opp=pirate&speed=4&skip=1');
    await expect(page.locator('.oppname')).toContainText('Pirate AI');
    await playToEnd(page);
    await expect(page.locator('#decision-title')).toHaveText('Game over');
    // Every AI move with a choice has a "Why?" chip on its log line (flows F10).
    const why = page.getByRole('button', { name: /^Why\?/ });
    expect(await why.count()).toBeGreaterThan(0);
    await why.last().click();
    const panel = page.getByRole('dialog', { name: 'Why?' });
    await expect(panel).toBeVisible();
    // AI explanations cite public information only, and the chip says so (explanations.md).
    await expect(panel).toContainText(/Public information only|Best found in its time/);
    await panel.getByRole('button', { name: /More/ }).click();
    await expect(panel.getByRole('list', { name: 'Why it works' })).toBeVisible();
    const r = await new AxeBuilder({ page })
      .include('.why-panel')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
    await page.screenshot({ path: `.cache/m5a/${test.info().project.name}-why.png` });
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    // W opens "Why?" for the last AI move.
    await page.locator('#decision-title').focus();
    await page.keyboard.press('w');
    await expect(page.getByRole('dialog', { name: 'Why?' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  /** Plays plainly at 1× (end each turn, take every hit) and returns the measured AI turns. */
  async function measure(page: Page, query: string, turns: number) {
    await startGame(page, query);
    for (let i = 0; i < 2000; i++) {
      const k = await nextDecision(page, 60_000);
      if (k === 'over') break;
      if ((await aiTurns(page)).length >= turns) break;
      if (k === 'main') await page.locator('#endturn-btn').click();
      else if (k === 'chooseFirst') await page.locator('#first-btn').click();
      else if (k === 'mulligan') await page.locator('#keep-btn').click();
      else if (k === 'block' || k === 'counter') await page.locator('#take-hit').click();
      else if (k === 'trigger') await page.locator('#trigger-hand').click();
      else if (k === 'optional') await page.locator('#skip-btn').click();
      else if (k === 'order') await page.locator('#order-0').click();
      else if (k === 'choose') {
        const opt = page.locator('#decision .opts button').first();
        if (await opt.count()) await opt.click();
        if ((await decisionKind(page)) === 'choose') await page.locator('#choose-done').click();
      }
      await page.waitForTimeout(20);
    }
    const out = (await aiTurns(page)).filter((t) => t.speed === '1');
    test.info().annotations.push({ type: 'ai-turn-ms', description: JSON.stringify(out) });
    console.log(`AI turns at 1× (${query}): ${JSON.stringify(out)}`);
    return out;
  }

  const median = (xs: number[]) =>
    xs.slice().sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)]!;

  test('an AI turn at 1× takes 8 s or less (flows F21)', async ({ page }) => {
    once();
    test.setTimeout(240_000);
    // The late-game position: the player ends each turn at once and takes every hit, so each AI
    // turn is measured as the player sees it (the player's own decisions excluded).
    const turns = await measure(page, 'scenario=late&opp=pirate&speed=1', 3);
    expect(turns.length).toBeGreaterThan(0);
    expect(median(turns.map((t) => t.ms))).toBeLessThanOrEqual(8000);
  });

  test('AI turns at 1× over a game from turn 1 (nightly)', async ({ page }) => {
    once();
    test.skip(!process.env.E2E_FULL, 'a turn-1 game at 1× runs nightly (E2E_FULL=1)');
    test.setTimeout(600_000);
    const turns = await measure(page, 'seed=31&first=me&opp=pirate&speed=1', 8);
    expect(turns.length).toBeGreaterThanOrEqual(3);
    expect(median(turns.map((t) => t.ms))).toBeLessThanOrEqual(8000);
  });
});
