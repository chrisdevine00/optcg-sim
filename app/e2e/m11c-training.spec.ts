/**
 * M11 Track C: Franky (OP18-021) and Monkey.D.Luffy Green/Purple (EB02-010) as the 13th and 14th
 * archetypes, walked the way the owner trains: Meta tile and guide, "Play this deck" and "Play
 * against this deck", Setup with both, the mulligan trainer for each (labelled as our reasoning, since
 * no written source exists), and a finished game as Franky that opens its review.
 */
import { expect, test } from '@playwright/test';
import { playToEnd, serveArt, startGame } from './game-support.ts';
import { axe, noArt } from './m9-support.ts';

const FRANKY = 'OP18-021-franky';
const LUFFY = 'EB02-010-luffy-gp';

test('Meta: both tiles, the guides, and the play links', async ({ page }, info) => {
  await serveArt(page);
  await page.goto('meta');
  await expect(page.getByRole('heading', { level: 1, name: 'Meta Explorer' })).toBeFocused();
  await expect(page.getByRole('link', { name: /^Franky, Green and Purple/ })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /^Luffy \(Green\/Purple\), Green and Purple/ }),
  ).toBeVisible();

  await page.goto('meta/OP18-021');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Franky (Green/Purple, OP18-021) archetype guide',
    }),
  ).toBeFocused();
  await expect(page.getByText('confidence: low').first()).toBeVisible();
  await expect(page.locator('.meta-infer').first()).toHaveText(/our reasoning/);
  await expect(page.getByRole('link', { name: 'Play against this deck' })).toHaveAttribute(
    'href',
    new RegExp(`/play\\?p2=${FRANKY}%231$`),
  );
  await expect(
    page.getByRole('link', { name: 'Try the mulligan trainer for this deck' }),
  ).toHaveAttribute('href', new RegExp(`/drills/mulligan\\?archetype=${FRANKY}$`));
  await axe(page, info, 'm11c-franky-guide');

  // Play this deck: Setup has Franky as the player's deck, and the game starts.
  await page.getByRole('link', { name: 'Play this deck', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/play\\?p1=${FRANKY}%231$`));
  await expect(page.getByText('50 cards · Franky · source decklist')).toBeVisible();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });

  await page.goto('meta/EB02-010');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Monkey.D.Luffy (Green/Purple, EB02-010) archetype guide',
    }),
  ).toBeFocused();
  await page.getByRole('link', { name: 'Play against this deck' }).click();
  await expect(page).toHaveURL(new RegExp(`/play\\?p2=${LUFFY}%231$`));
  await expect(page.getByText('50 cards · Monkey.D.Luffy · source decklist').first()).toBeVisible();
});

test('Setup can pick both decks, and the game starts', async ({ page }) => {
  await serveArt(page);
  await page.goto('play');
  const p1 = page.locator('select[name="mine-archetype"], select[name="p1-archetype"]').first();
  await expect(p1.locator('option', { hasText: 'Franky (OP18-021)' })).toHaveCount(1);
  await expect(p1.locator('option', { hasText: 'Monkey.D.Luffy (EB02-010)' })).toHaveCount(1);
  await page.goto(`play?p1=${LUFFY}%231&p2=${FRANKY}%231&opp=rookie`);
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('#decision')).toBeVisible({ timeout: 20_000 });
});

for (const [archetype, guide] of [
  [FRANKY, 'Franky'],
  [LUFFY, 'Luffy GP'],
] as const) {
  test(`the mulligan trainer for ${guide} labels its items as our reasoning`, async ({
    page,
  }, info) => {
    await noArt(page);
    await page.goto(
      `drills/mulligan/run?source=bank&count=5&sid=e2e-m11c-${archetype}&archetype=${archetype}`,
    );
    await expect(page.getByRole('heading', { level: 1, name: /Keep or redraw/ })).toBeFocused();
    await page.getByRole('button', { name: /^Keep/ }).click();
    await expect(page.getByText(/The guide says/).first()).toBeVisible();
    await expect(
      page.getByText(`From the ${guide} guide (our reasoning, no written source)`).first(),
    ).toBeVisible();
    await axe(page, info, `m11c-mulligan-${archetype}`);
  });
}

test('a finished game as Franky opens its review', async ({ page }) => {
  test.setTimeout(300_000);
  await startGame(page, `p1=${FRANKY}%231&p2=OP17-039-rocks%231&opp=rookie`);
  await playToEnd(page);
  await page.locator('#review-btn').click();
  await expect(page.getByTestId('review-status')).toBeVisible({ timeout: 30_000 });
});
