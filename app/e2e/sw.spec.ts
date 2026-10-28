import { expect, test } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

// The production build registers the image service worker; this checks it controls the page and fills
// the bounded image cache (ARCHITECTURE §5). Image hosts are routed at the context level, which in
// Chromium also covers requests the service worker makes, so no test touches the network.
test.use({ serviceWorkers: 'allow' });

test('the service worker caches card images in a production build', async ({ context, page }) => {
  let served = 0;
  await context.route(/https:\/\/optcgapi\.com\/.*/, (r) => {
    served++;
    return r.fulfill({
      status: 200,
      contentType: 'image/png',
      body: PNG,
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  await page.goto('./cards');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 15_000,
  });
  // Images requested before the worker took control are not cached; reload so they go through it.
  await page.reload();
  await expect(page.locator('.face[data-art="image"]').first()).toBeVisible();
  const cached = await page.evaluate(async () => {
    const deadline = Date.now() + 10_000;
    for (;;) {
      const keys = await (await caches.open('optcg-images-v1')).keys();
      if (keys.length > 10 || Date.now() > deadline) return keys.map((k) => k.url);
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  expect(cached.length).toBeGreaterThan(10);
  expect(cached.every((u) => u.startsWith('https://optcgapi.com/media/static/Card_Images/'))).toBe(
    true,
  );
  expect(served).toBeGreaterThan(0);
  // A second visit is served from the cache: no new requests reach the image host for cached images.
  const before = served;
  await page.reload();
  await expect(page.locator('.face[data-art="image"]').first()).toBeVisible();
  expect(served - before).toBeLessThan(cached.length);
});
