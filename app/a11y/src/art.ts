import type { Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** As in app/e2e: no network and no card art; a 1×1 PNG stands in for every card image. */
export async function serveArt(page: Page) {
  await page.route(/https:\/\/(optcgapi\.com|optcg-api\.arjunbansal-ai\.workers\.dev)\/.*/, (r) =>
    r.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
}

/**
 * §11.3 step 1 starts "from the page top": puts the browser's Tab starting point at the start of
 * the document (the app focuses its decision panel on load, and Guidepup clicks the page).
 */
export async function startAtTop(page: Page) {
  await page.evaluate(() => {
    const b = document.body;
    b.tabIndex = -1;
    b.focus();
    b.removeAttribute('tabindex');
  });
}
