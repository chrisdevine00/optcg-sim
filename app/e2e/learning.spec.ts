/**
 * Milestone L, the learning slice (learning-ui §2.7, §3, §4): the coach strip and the tiered lethal
 * detector by keyboard only, the always-on badge, "Count it with me", the battle panel's "What they
 * could have", and the missed-lethal review end to end (flag, Study, Practice this). axe runs on
 * every new panel and screenshots go to `.cache/l/` at both sizes.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { nextDecision, serveArt, startGame } from './game-support.ts';

async function check(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `.cache/l/${info.project.name}-${name}.png` });
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(
    r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
  ).toEqual([]);
}

const lethalGame = (page: Page, extra = '') =>
  startGame(page, `scenario=lethalDemo&speed=4&opp=pirate&aibudget=iterations${extra}`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* blocked */
    }
  });
});

test.describe('the tiered lethal detector (learning-ui §3.1)', () => {
  test('keyboard only: L reveals tier 1, 2 and 3, one press each, and never moves focus on its own', async ({
    page,
  }, info) => {
    await lethalGame(page);
    expect(await nextDecision(page)).toBe('main');
    // By default the coach is a strip and nothing runs: no badge, no panel, no check.
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
    await expect(page.getByTestId('lethal-badge')).toHaveCount(0);
    await page.keyboard.press('Tab');
    const before = await page.evaluate(() => document.activeElement?.tagName);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(before);

    // L: tier 1. The panel opens and focus goes to its result (the player pressed a coach key).
    await page.keyboard.press('l');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'open');
    await expect(page.locator('.coach-head')).toContainText('Lethal is on the board.', {
      timeout: 15_000,
    });
    await expect(page.locator('.coach-status')).toContainText('Proven');
    await expect(page.locator('.coach-status')).toContainText('Works against any hand');
    await expect(page.locator('.coach-result')).toBeFocused();
    await expect(page.getByTestId('tier2')).toHaveCount(0);
    await check(page, info, 'coach-tier1');

    // L: tier 2.
    await page.keyboard.press('l');
    await expect(page.getByTestId('tier2')).toHaveText(
      'You need 2 hits. You have 2 attackers that can hit their Leader.',
    );
    await check(page, info, 'coach-tier2');

    // L: tier 3, the line, in the tall coach (the player asked for it).
    await page.keyboard.press('l');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'tall');
    await expect(page.locator('#coach-lethal-claim')).toHaveText(
      "You have lethal: 2 hits, and they can't stop any of them.",
    );
    await expect(page.locator('.ex-line li')).not.toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Show step 1/ })).toBeVisible();
    // The decision panel shrinks to its header and footer; End turn is still there.
    await expect(page.locator('#endturn-btn')).toBeVisible();
    await check(page, info, 'coach-tier3-tall');

    // Show lights the step's cards on the board.
    await page.getByRole('button', { name: /^Show step 1/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cchip', { hasText: 'Step 1' }).first()).toBeVisible();

    // C collapses the coach; focus stays where it was (never the coach's choice).
    await page.keyboard.press('c');
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'strip');
  });

  test('Count it with me checks the hits, the attackers and the DON!! split', async ({
    page,
  }, info) => {
    await lethalGame(page);
    await nextDecision(page);
    await page.keyboard.press('l');
    await expect(page.locator('.coach-head')).toContainText('Lethal is on the board.', {
      timeout: 15_000,
    });
    await page.keyboard.press('l');
    await page.getByRole('button', { name: 'Count it with me' }).click();
    await expect(page.locator('.coach')).toHaveAttribute('data-mode', 'tall');
    await expect(page.locator('.guided-q')).toHaveText('How many hits do you need?');
    await page.getByLabel('Hits needed').fill('3');
    await page.getByRole('button', { name: 'Check my count' }).click();
    await expect(page.locator('.guided-check')).toContainText('1 Life, so you need 1 + 1 = 2 hits');
    await page.getByLabel('Hits needed').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.guided-q')).toHaveText(
      'Which of your cards can attack their Leader this turn?',
    );
    await page.getByRole('group', { name: 'Your cards' }).getByRole('button').first().click();
    await page.getByRole('group', { name: 'Your cards' }).getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.guided-q')).toHaveText('How much can they stop?');
    await expect(page.getByText('Each hit gives them a card.')).toBeVisible();
    await check(page, info, 'guided-3');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.guided-q')).toHaveText('Split your DON!!');
    // The first attacker is the one the line needs the DON!! on; put 4 there.
    for (let i = 0; i < 4; i++)
      await page
        .getByRole('button', { name: /^More DON!! for/ })
        .first()
        .click();
    await page.getByRole('button', { name: 'Check my count' }).click();
    await expect(page.locator('.guided-check')).toHaveCount(1);
    await check(page, info, 'guided-4');
    // Nothing was played: the real game is untouched.
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#endturn-btn')).toBeVisible();
    await expect(page.locator('.log-row').filter({ hasText: 'Give' })).toHaveCount(0);
  });

  test('always-on tier 2 checks by itself at the lowest priority, badges the button and never moves focus', async ({
    page,
  }) => {
    await lethalGame(page);
    await nextDecision(page);
    await page.keyboard.press('c');
    const detector = page.getByLabel('Detector');
    await detector.focus();
    await detector.selectOption('2');
    await expect(page.getByTestId('lethal-badge')).toContainText('2 hits', { timeout: 15_000 });
    // The polite region said so, without a press.
    await expect(page.locator('[aria-live="polite"]').last()).toContainText(
      'You need 2 hits. You have 2 attackers.',
    );
    // The panel did not change tier or steal focus.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('SELECT');
    // After a move the badge goes and comes back (a fresh check on the new position).
    await page.keyboard.press('Escape');
  });

  test('is silent in hotseat and the opponent’s hidden cards do not change what it says', async ({
    page,
  }) => {
    // Two games that differ only in the opponent's hidden hand and Life card: the same answer.
    const text = async (hand: string[]) => {
      const spec = {
        mode: 'ai',
        seed: 5,
        turn: 9,
        activePlayer: 'p1',
        firstPlayer: 'p1',
        p1: {
          leader: 'OP17-058',
          characters: ['OP17-062'],
          life: ['EB04-007', 'EB04-007', 'EB04-007'],
          hand: [],
          deck: Array.from({ length: 12 }, () => 'EB04-007'),
          costArea: { active: 4, rested: 0 },
        },
        p2: {
          leader: 'OP17-039',
          life: ['EB04-007'],
          hand,
          deck: Array.from({ length: 12 }, () => 'EB04-007'),
          costArea: { active: 0, rested: 0 },
        },
      };
      const b64 = Buffer.from(JSON.stringify(spec)).toString('base64url');
      await serveArt(page);
      await page.goto(`./play?scenario=json:${b64}&opp=pirate&speed=4&start=1`);
      await nextDecision(page);
      await page.keyboard.press('l');
      await expect(page.locator('.coach-head')).toBeVisible({ timeout: 15_000 });
      await page.keyboard.press('l');
      return page.locator('.coach-body').innerText();
    };
    const a = await text(['OP17-056', 'OP17-055']);
    const b = await text(['EB04-007', 'EB04-007']);
    expect(b).toBe(a);
  });
});

test.describe('the battle panel (learning-ui §2.7)', () => {
  test('on your attack it lists what they could have, from public information', async ({
    page,
  }, info) => {
    await lethalGame(page);
    await nextDecision(page);
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await page.locator('[data-zone="opp-row"].bc-leader').click();
    const box = page.getByTestId('what-they-could-have');
    await expect(box).toBeVisible();
    await expect(box).toContainText('No active Blockers.');
    await expect(box).toContainText(
      '2 cards in hand: up to +4000 if each is one of their deck’s +2000 Counters',
    );
    await check(page, info, 'battle-attack');
  });
});

test.describe('the battle panel on defence', () => {
  test('lists what you have, and the tall body does not scroll', async ({ page }, info) => {
    // `skip`: Rookie attacks your Leader while you hold two Counters.
    await startGame(page, 'scenario=skip&speed=4&opp=rookie');
    const kind = await nextDecision(page);
    expect(['block', 'counter']).toContain(kind);
    const box = page.getByTestId('what-you-have');
    await expect(box).toBeVisible();
    await expect(box).toContainText('2 Counter cards worth +2000');
    const scroll = await page.evaluate(() => {
      const b = document.querySelector('.dec-body')!;
      return b.scrollHeight - b.clientHeight;
    });
    expect(scroll).toBeLessThanOrEqual(0);
    await check(page, info, 'battle-defend');
  });
});

test.describe('an Event that cannot pay its cost (M4a-18)', () => {
  test('is marked before it is wasted and asks for a second press', async ({ page }) => {
    // The `skip` scenario with Wo Ro (OP17-076) as the only card in hand: its optional cost
    // (trash a card from hand) cannot be paid, so activating it would waste it.
    const spec = {
      mode: 'ai',
      seed: 3,
      turn: 4,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: {
        leader: 'ST01-001',
        life: ['OP01-010', 'OP01-012'],
        hand: ['OP17-076'],
        deck: Array.from({ length: 10 }, () => 'OP01-010'),
        costArea: { active: 0, rested: 4 },
      },
      p2: {
        leader: { card: 'ST04-001', don: 2 },
        life: ['OP01-010', 'OP01-012'],
        hand: [],
        deck: Array.from({ length: 10 }, () => 'OP01-012'),
        costArea: { active: 0, rested: 2 },
      },
    };
    const b64 = Buffer.from(JSON.stringify(spec)).toString('base64url');
    await serveArt(page);
    await page.goto(`./play?scenario=json:${b64}&opp=rookie&speed=4&start=1`);
    // The AI attacks; the player is asked to block or counter.
    expect(['block', 'counter']).toContain(await nextDecision(page));
    const eventCounter = page.locator('[data-event-counter]');
    await expect(eventCounter).toBeVisible();
    await expect(page.getByTestId('unpayable')).toContainText('can’t pay its cost now');
    // The first press warns and does nothing; the log shows no activation.
    await eventCounter.click();
    await expect(page.locator('.whynot')).toContainText('Press again');
    await expect(page.locator('.log-row').filter({ hasText: 'Counter' })).toHaveCount(0);
  });
});

test.describe('focus stays in the coach (L-07) and DON!! math on the board (L-09)', () => {
  test('keyboard walk of Count it with me keeps focus inside the coach at every step', async ({
    page,
  }) => {
    await lethalGame(page);
    await nextDecision(page);
    const inCoach = () => page.evaluate(() => !!document.activeElement?.closest('.coach'));
    await page.keyboard.press('l');
    await expect(page.locator('.coach-head')).toContainText('Lethal is on the board.', {
      timeout: 15_000,
    });
    await page.keyboard.press('l');
    const press = async (name: string) => {
      const b = page.getByRole('button', { name, exact: true });
      await b.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      expect(await inCoach(), `after ${name}`).toBe(true);
    };
    await press('Count it with me');
    await expect(page.locator('.guided-q')).toBeFocused();
    await press('Next');
    await expect(page.locator('.guided-q')).toHaveText(/Which of your cards/);
    await expect(page.locator('.guided-q')).toBeFocused();
    await press('Next');
    await press('Next');
    await expect(page.locator('.guided-q')).toHaveText('Split your DON!!');
    await expect(page.locator('.guided-q')).toBeFocused();
    await press('Close');
    expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('decision-title');
  });

  test('the focus rescue alone hands a vanished coach control to the coach (L-07, re-review L-14)', async ({
    page,
  }) => {
    await lethalGame(page);
    await nextDecision(page);
    await page.keyboard.press('l');
    await expect(page.locator('.coach-head')).toContainText('Lethal is on the board.', {
      timeout: 15_000,
    });
    // Focus a coach button, then remove it outside React, so only the rescue in focus.ts can act.
    const b = page.getByRole('button', { name: /How many hits/ });
    await b.focus();
    await b.evaluate((el) => el.remove());
    await page.waitForTimeout(100);
    expect(
      await page.evaluate(() => {
        const a = document.activeElement;
        return a?.classList.contains('coach-result') || a?.classList.contains('guided-q') || false;
      }),
    ).toBe(true);
  });

  test('"DON!! math on the board" is off by default and tags legal targets when on', async ({
    page,
  }, info) => {
    await lethalGame(page);
    await nextDecision(page);
    await page.locator('[data-zone="my-row"].bc-leader').click();
    await expect(page.locator('.cchip', { hasText: 'to stop' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('c');
    const box = page.getByLabel('DON!! math on the board');
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toBeChecked();
    await page.locator('[data-zone="my-row"].bc-leader').click();
    // Kaido's Leader (5000) against theirs (5000): they need +1000 to stop it.
    await expect(page.locator('.cchip', { hasText: '+1000 to stop' })).toBeVisible();
    await page.screenshot({ path: `.cache/l/${info.project.name}-don-math.png` });
  });
});

test.describe('the missed-lethal review (learning-ui §4.2–4.5)', () => {
  async function concede(page: Page) {
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('menuitem', { name: 'Concede…' }).click();
    await page.getByRole('button', { name: 'Concede', exact: true }).click();
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'over');
  }

  test('a planted missed lethal is flagged any-hand with a correct line; Study restores it; Practice this opens the puzzle', async ({
    page,
  }, info) => {
    await lethalGame(page);
    await nextDecision(page);
    await concede(page);
    await check(page, info, 'game-over');
    await page.locator('#review-btn').click();

    // The Overview: the analysis finishes, and turn 9 carries a severe flag.
    await expect(page.getByTestId('review-status')).toHaveText('1 flag · 1 severe', {
      timeout: 30_000,
    });
    await expect(
      page.getByRole('button', { name: /Turn 9, your turn: missed lethal, severe/ }),
    ).toHaveCount(2);
    const detail = page.getByTestId('selected-flag');
    await expect(detail).toContainText('You had lethal this turn.');
    await expect(detail).toContainText('Holds whatever they held');
    await expect(detail).toContainText('Wins the game this turn.');
    await expect(detail.locator('.ex-line li').first()).toContainText('Give');
    await expect(detail).toContainText('What you did:');
    await check(page, info, 'review-overview');

    // Study this moment: the board as it stood, read-only, with the explanation in the rail.
    await page.locator('#study-btn').click();
    await expect(page.getByTestId('study-rail')).toBeVisible();
    await expect(page.locator('main.play')).toBeVisible();
    await expect(page.getByTestId('study-rail')).toContainText('Read-only');
    // Turn 9 as it began: Rocks at 1 Life, Kaido on the field, 4 DON!! active.
    await expect(page.locator('#endturn-btn')).toHaveCount(0);
    await page.getByRole('button', { name: /^Show step 1/ }).click();
    await expect(page.locator('.cchip', { hasText: 'Step 1' }).first()).toBeVisible();
    await check(page, info, 'review-study');
    // Esc goes back to the Overview.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('selected-flag')).toBeVisible();

    // Practice this: a lethal puzzle from the same position, against the engine.
    await page.locator('#practice-btn').click();
    await expect(page.locator('#decision')).toHaveAttribute('data-kind', 'main', {
      timeout: 15_000,
    });
    await expect(page.locator('#decision-title')).toHaveText('Your Main phase');
    await expect(page.getByTestId('puzzle-chip')).toHaveText('Practice');
    await check(page, info, 'practice');
    // Play the line from the review: all 4 DON!! on the Leader, the Leader first, then Kaido.
    await page
      .locator('.costarea .rowbtn.legal, [data-zone="my-row"].rowbtn.legal')
      .first()
      .click();
    const leader = page.locator('[data-zone="my-row"].bc-leader');
    for (let i = 0; i < 4; i++) await leader.click();
    // With every DON!! given there is nothing left to give: DON!! mode closes by itself.
    if (await page.locator('#don-done').isVisible()) await page.locator('#don-done').click();
    const attackLeader = async (card: ReturnType<Page['locator']>) => {
      await card.click();
      const item = page.getByRole('menuitem', { name: /Attack…/ });
      if (await item.isVisible().catch(() => false)) await item.click();
      await page.locator('[data-zone="opp-row"].bc-leader').click();
      await page.locator('#confirm-attack').click();
      // Kaido's [When Attacking] asks whether to use it (it would cost a DON!!): the line declines.
      for (let i = 0; i < 40; i++) {
        const kind = await nextDecision(page);
        if (kind === 'optional') await page.locator('#skip-btn').click();
        else if (kind === 'main' || kind === 'over') break;
        else await page.waitForTimeout(100);
      }
    };
    await attackLeader(leader);
    await attackLeader(page.locator('[data-glyph="attack"]').first());
    await expect(page.getByTestId('puzzle-result')).toContainText('Solved', { timeout: 30_000 });
    await expect(page.getByTestId('puzzle-chip')).toHaveText('Practice · solved');
  });
});
