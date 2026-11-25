/**
 * M7-R5: in a battle the opponent-activity caption ("Ace & Newgate attacks your Leader", left of
 * the midline) must not overprint the turn words and the phase stepper (centre). Geometry, at both
 * viewport sizes, on tutorial step 5 and on a defence in an ordinary game (board.md §3.8).
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';
import { fresh, myTurn, startAt } from './tutorial-support.ts';

async function noOverlap(page: Page) {
  const g = await page.evaluate(() => {
    const box = (s: string) => {
      const el = document.querySelector<HTMLElement>(s)!;
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, text: el.textContent ?? '' };
    };
    return {
      mid: box('.midline'),
      left: box('.mid-left'),
      words: box('.turn-words'),
      stepper: box('.stepper'),
    };
  });
  expect(g.left.text.trim().length).toBeGreaterThan(0);
  // The caption's box ends before the turn words begin, and both sit inside the midline band.
  expect(g.left.r).toBeLessThanOrEqual(g.words.l);
  expect(g.words.r).toBeLessThanOrEqual(g.stepper.l + 1);
  expect(g.left.l).toBeGreaterThanOrEqual(g.mid.l);
  expect(g.stepper.r).toBeLessThanOrEqual(g.mid.r + 1);
  // And the caption's text does not spill out of its own box.
  const spill = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.mid-left .vis')!;
    return el.scrollWidth > el.clientWidth + 1;
  });
  expect(spill).toBe(false);
}

test.describe('the battle caption and the turn bar do not overlap (M7-R5)', () => {
  test('tutorial step 5, the first defence', async ({ page }) => {
    await fresh(page);
    await startAt(page, 5);
    await myTurn(page, 'block');
    await noOverlap(page);
  });

  test('a defence in an ordinary game', async ({ page }) => {
    await startGame(page, 'scenario=ub-why-1&opp=pirate&speed=4&aibudget=iterations');
    for (let i = 0; i < 12; i++) {
      const k = await nextDecision(page, 60_000);
      if (k === 'block' || k === 'counter') break;
      if (k === 'main') await page.locator('#endturn-btn').click();
      else if (k === 'trigger') await page.locator('#trigger-hand').click();
      else if (k === 'optional') await page.locator('#skip-btn').click();
      else if (k === 'choose') await page.locator('#decision .opts button').first().click();
      await page.waitForTimeout(50);
    }
    expect(['block', 'counter']).toContain(await nextDecision(page));
    await noOverlap(page);
  });
});
