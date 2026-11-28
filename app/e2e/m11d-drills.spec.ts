/**
 * M11 Track C drills: "Practise with Franky" on the Meta guide opens the drills hub filtered to that
 * Leader (`?leader=OP18-021`), every drill start screen carries it as the archetype, and every drill
 * runs only items where it is the player's Leader. Keyboard only, axe on each screen.
 */
import { expect, test } from '@playwright/test';
import { axe, noArt } from './m9-support.ts';

const FRANKY = 'OP18-021-franky';

test.beforeEach(async ({ page }) => {
  await noArt(page);
});

test('Franky guide to the filtered drills hub, start screens and runs, by keyboard', async ({
  page,
}, info) => {
  await page.goto('meta/OP18-021');
  const practise = page.getByRole('link', { name: 'Practise with Franky' });
  await expect(practise).toHaveAttribute('href', /\/drills\?leader=OP18-021$/);
  await practise.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/drills\?leader=OP18-021$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Drills' })).toBeFocused();
  await expect(page.getByTestId('drills-leader')).toContainText('Practising with');
  await axe(page, info, 'm11d-hub');
  for (const name of [
    'Mulligan trainer',
    'Lethal puzzles',
    'Counter or take it',
    'DON!! efficiency',
  ])
    await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveAttribute(
      'href',
      /\?leader=OP18-021$/,
    );

  // The start screen has the Leader's archetype chosen already.
  const counter = page.getByRole('link', { name: /Counter or take/ });
  await counter.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Archetype')).toHaveValue(FRANKY);
  await axe(page, info, 'm11d-start');
  const start = page.getByRole('button', { name: 'Start' });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`drills/counter/run\\?.*archetype=${FRANKY}`));
});

for (const drill of ['mulligan', 'lethal', 'counter', 'don'] as const)
  for (const [leader, name] of [
    ['OP18-021', 'Franky'],
    ['EB02-010', 'Luffy'],
  ] as const)
    test(`${drill} runs for ?leader=${leader} (${name})`, async ({ page }, info) => {
      await page.goto(`drills/${drill}/run?source=bank&count=5&sid=e2e-m11d&leader=${leader}`);
      await expect(page.getByTestId('drill-progress')).toContainText('Item 1 of 5', {
        timeout: 60_000,
      });
      if (drill === 'mulligan') {
        await page.getByRole('button', { name: /^Keep/ }).click();
        await expect(
          page
            .getByText(new RegExp(`From the ${name === 'Luffy' ? 'Luffy GP' : name} guide`))
            .first(),
        ).toBeVisible();
      }
      await axe(page, info, `m11d-${drill}-${leader}`);
    });

test('a Leader with no items says so', async ({ page }) => {
  await page.goto('drills/mulligan/run?source=bank&count=5&sid=e2e-m11d&leader=OP05-098');
  await expect(page.getByText('No sourced mulligan rule for this deck yet.')).toBeVisible();
});
