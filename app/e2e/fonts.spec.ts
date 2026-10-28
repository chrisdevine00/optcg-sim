import { expect, test } from '@playwright/test';

// visual-system.md §4: Inter and Fraunces are self-hosted, and every numeral is tabular.
test('self-hosted fonts load and numerals are tabular', async ({ page }) => {
  await page.goto('./');
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const probe = (text: string, family: string) => {
      const el = document.createElement('span');
      el.textContent = text;
      el.style.cssText = `font-family:${family};font-size:40px;position:absolute;white-space:pre;font-feature-settings:'tnum' 1`;
      document.body.append(el);
      const width = el.getBoundingClientRect().width;
      el.remove();
      return width;
    };
    const ui = getComputedStyle(document.documentElement).getPropertyValue('--font-ui');
    return {
      inter: document.fonts.check('16px "Inter Variable"'),
      fraunces: document.fonts.check('600 32px "Fraunces Variable"'),
      ones: probe('1111111111', ui),
      eights: probe('8888888888', ui),
    };
  });
  expect(result.inter).toBe(true);
  expect(result.fraunces).toBe(true);
  expect(Math.abs(result.ones - result.eights)).toBeLessThan(0.5);
});
