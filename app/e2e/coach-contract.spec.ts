/**
 * M7 WP5, the interruption contract (learning-ui §2.2) in the browser: a whole game against Rookie,
 * with a `focusin` recorder and a MutationObserver watching the coach, never touching H, W, L or C.
 * The coach panel must never expand, focus must never land inside it, and the assertive live region
 * must never hold coach text. Variants: tier 1 always on (a badge and a polite line only) and the
 * blunder warning on (a note at a commit only). A last test shows the recorder is not blind: a
 * coach key does move focus and open the panel, and the recorder sees it.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, playToEnd, startGame } from './game-support.ts';

interface Recorded {
  focus: string[];
  modes: string[];
  assertive: string[];
  notes: number;
  /** Polite lines the coach spoke (the live region's `data-source` is `coach`). */
  politeCoach: string[];
  /** Assertive lines the coach spoke, by source rather than by wording. */
  assertiveCoach: string[];
}

/** Install the recorders before the page's own scripts run. */
async function record(page: Page, profile: Record<string, unknown> = {}) {
  await page.addInitScript((p) => {
    try {
      // Seed the profile once per tab, so a reload keeps what the game wrote.
      if (!window.sessionStorage.getItem('wp5-seeded')) {
        window.localStorage.clear();
        window.localStorage.setItem('optcg.coach.v1', JSON.stringify(p));
        window.sessionStorage.setItem('wp5-seeded', '1');
      }
    } catch {
      /* blocked */
    }
    const rec = {
      focus: [] as string[],
      modes: [] as string[],
      assertive: [] as string[],
      notes: 0,
      politeCoach: [] as string[],
      assertiveCoach: [] as string[],
    };
    (window as unknown as { __rec: typeof rec }).__rec = rec;
    document.addEventListener(
      'focusin',
      (e) => {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.('[aria-label="Coach"]')) rec.focus.push(t.id || t.className || t.tagName);
      },
      true,
    );
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>('[aria-label="Coach"]')) {
        const m = el.getAttribute('data-mode');
        if (m && m !== 'strip') rec.modes.push(m);
      }
      const a = document.getElementById('announce-assertive')?.textContent?.trim();
      if (a) rec.assertive.push(a);
      const ac = document.querySelector('#announce-assertive [data-source="coach"]');
      if (ac?.textContent?.trim()) rec.assertiveCoach.push(ac.textContent.trim());
      const pol = document.getElementById('announce-polite');
      const pt = pol?.getAttribute('data-source') === 'coach' ? pol.textContent?.trim() : '';
      if (pt && rec.politeCoach[rec.politeCoach.length - 1] !== pt) rec.politeCoach.push(pt);
      if (document.querySelector('.blunder-note')) rec.notes++;
      const inside = document.activeElement?.closest?.('[aria-label="Coach"]');
      if (inside) rec.focus.push('activeElement');
    };
    const start = () => {
      new MutationObserver(scan).observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }, profile);
}

async function read(page: Page): Promise<Recorded> {
  return page.evaluate(() => {
    const r = (window as unknown as { __rec: Recorded }).__rec;
    return {
      focus: [...r.focus],
      modes: [...r.modes],
      assertive: [...r.assertive],
      notes: r.notes,
      politeCoach: [...r.politeCoach],
      assertiveCoach: [...r.assertiveCoach],
    };
  });
}

/** The words the coach uses; none may reach the assertive region. */
const COACH_WORDS = /coach|hint|lethal|tempo|blunder|warning|threat/i;

const GAME = 'seed=42&first=me&speed=4&skip=1&opp=rookie&aibudget=iterations';

test.describe('the coach never interrupts (full game vs Rookie)', () => {
  test('at the defaults: no coach focus, no expansion, no assertive coach text', async ({
    page,
  }) => {
    await record(page);
    await startGame(page, GAME);
    await playToEnd(page);
    const r = await read(page);
    expect(r.focus).toEqual([]);
    expect(r.modes).toEqual([]);
    expect(r.assertive.filter((t) => COACH_WORDS.test(t))).toEqual([]);
    // M7-R3: by source, not by wording: the coach says nothing at all, politely or assertively.
    expect(r.politeCoach).toEqual([]);
    expect(r.assertiveCoach).toEqual([]);
    await expect(page.locator('[aria-label="Coach"]')).toHaveAttribute('data-mode', 'strip');
    // Nothing was computed on the player's behalf: no hint or lethal badge (the tempo bar is a meter).
    await expect(page.getByTestId('hint-badge')).toHaveCount(0);
    await expect(page.getByTestId('lethal-badge')).toHaveCount(0);
  });

  test('tier 1 always on: a badge and a polite line only', async ({ page }) => {
    await record(page, { alwaysOn: 1 });
    await startGame(page, GAME);
    await playToEnd(page);
    const r = await read(page);
    expect(r.focus).toEqual([]);
    expect(r.modes).toEqual([]);
    expect(r.assertive.filter((t) => COACH_WORDS.test(t))).toEqual([]);
    expect(r.assertiveCoach).toEqual([]);
  });

  test('blunder warning on: a note only at a commit, never an expansion or a focus move', async ({
    page,
  }) => {
    await record(page, { blunder: true });
    await startGame(page, GAME);
    // A player who only ever ends the turn: every End turn is a commit the warning may hold.
    let notes = 0;
    for (let i = 0; i < 400; i++) {
      const k = await nextDecision(page);
      if (k === 'over') break;
      if (k === 'chooseFirst') await page.locator('#first-btn').click();
      else if (k === 'mulligan') await page.locator('#keep-btn').click();
      else if (k === 'main') {
        const board = page.locator('[aria-label^="Game board"]');
        const before = await board.getAttribute('aria-label');
        await page.locator('#endturn-btn').click();
        // Held (a note), or committed (the turn moves on, even if the next Main arrives at once).
        await expect
          .poll(
            async () =>
              (await page.locator('.blunder-note').count()) > 0 ||
              (await board.getAttribute('aria-label')) !== before,
            { timeout: 5000 },
          )
          .toBe(true);
        if (await page.locator('.blunder-note').count()) {
          notes++;
          await page.locator('#endturn-btn').click();
          await expect(page.locator('.blunder-note')).toHaveCount(0);
        }
      } else if (k === 'block' || k === 'counter') await page.locator('#take-hit').click();
      else if (k === 'trigger') await page.locator('#trigger-hand').click();
      else if (k === 'optional') await page.locator('#skip-btn').click();
      else if (k === 'order') await page.locator('#order-0').click();
      else if (k === 'choose') await page.locator('#decision .opts button').first().click();
      await page.waitForTimeout(20);
    }
    const r = await read(page);
    expect(r.focus).toEqual([]);
    expect(r.modes).toEqual([]);
    expect(r.assertive.filter((t) => COACH_WORDS.test(t))).toEqual([]);
    // The warning did speak at commits (ending with DON!! unused), and only there.
    expect(notes).toBeGreaterThan(0);
    expect(r.notes).toBeGreaterThan(0);
    expect(r.assertiveCoach).toEqual([]);
    // Polite, and only the warning itself.
    expect(r.politeCoach.length).toBeGreaterThan(0);
    for (const line of r.politeCoach) expect(line).toMatch(/^Warning:/);
  });

  test('the recorder is not blind: H opens the coach and moves focus into it', async ({ page }) => {
    await record(page);
    await startGame(page, 'scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations');
    expect(await nextDecision(page)).toBe('main');
    await page.waitForTimeout(400);
    expect((await read(page)).modes).toEqual([]);
    await page.keyboard.press('h');
    await expect(page.locator('[aria-label="Coach"]')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('.coach-hint')).toBeFocused({ timeout: 5000 });
    const r = await read(page);
    expect(r.modes).toContain('open');
    expect(r.focus.length).toBeGreaterThan(0);
    // The polite recorder is not blind either: the press is spoken, tagged as the coach.
    expect(r.politeCoach.length).toBeGreaterThan(0);
  });
});
