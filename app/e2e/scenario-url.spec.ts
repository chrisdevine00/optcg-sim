import { expect, test } from '@playwright/test';
import { serveArt } from './game-support.ts';

const url = (spec: unknown) =>
  `./play?scenario=json:${Buffer.from(JSON.stringify(spec)).toString('base64url')}&start=1`;

test.describe('scenario URLs are validated (review M3-43)', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== '720p', 'one pass is enough');
  });

  test('a spec with no mode returns to setup with a message instead of hanging', async ({
    page,
  }) => {
    await serveArt(page);
    await page.goto(
      url({
        seed: 1,
        turn: 3,
        activePlayer: 'p1',
        firstPlayer: 'p1',
        p1: { leader: 'ST01-001' },
        p2: { leader: 'ST04-001' },
      }),
    );
    await expect(page.getByText(/Couldn’t start the game/)).toBeVisible();
    await expect(page.getByText(/needs "mode": "ai" or "hotseat"/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New game' })).toBeVisible();
  });

  test('an unreadable spec says so too', async ({ page }) => {
    await serveArt(page);
    await page.goto('./play?scenario=json:%25%25%25&start=1');
    await expect(page.getByText(/could not be read/)).toBeVisible();
  });
});
