/**
 * M8 WP7: the planted games in a real browser, on the production build. The games (missed lethal,
 * wasted counter, E05, E06, E08) are built in globalSetup, loaded into IndexedDB, and each shows its
 * flag on the timeline and in the list with its explanation. Keyboard walk, axe states and the 60 s
 * gate are in the sibling `review-m8-*.spec.ts` files.
 */
import { expect, test } from '@playwright/test';
import { load, planted, shot, status } from './review-m8-support.ts';

// ---------------------------------------------------------------------------------------------
// The planted games
// ---------------------------------------------------------------------------------------------

const PLANTED: { name: string; kind: RegExp; severity: RegExp; says: RegExp }[] = [
  {
    name: 'missed-lethal',
    kind: /Missed lethal/,
    severity: /Severe/,
    says: /You had lethal this turn\./,
  },
  {
    name: 'wasted-counter',
    kind: /Counter wasted/,
    severity: /Moderate/,
    says: /This counter didn't need playing\./,
  },
  {
    name: 'should-counter',
    kind: /Hit that should have been countered/,
    severity: /Severe/,
    says: /Taking that hit lost the game\./,
  },
  {
    name: 'don-unused',
    kind: /DON!! left unused/,
    severity: /Moderate/,
    says: /You left 3 DON!! unused\./,
  },
  {
    name: 'target',
    kind: /Poor attack ordering/,
    severity: /Moderate/,
    says: /Newgate was the better target for your Leader\./,
  },
];

test.describe('the planted games', () => {
  for (const p of PLANTED) {
    test(`${p.name}: the flag is on the timeline and in the list, with its explanation`, async ({
      page,
    }, info) => {
      const g = planted()[p.name]!;
      await load(page, [g], `./reviews/${g.id}`);
      await expect(status(page)).toContainText(/\d flags?/, { timeout: 45_000 });
      await expect(status(page)).not.toContainText('Analysing');
      const option = page
        .getByRole('listbox', { name: /^Flags/ })
        .getByRole('option', { name: p.kind });
      await expect(option.first()).toBeVisible();
      await option.first().click();
      const detail = page.getByTestId('selected-flag');
      await expect(detail).toContainText(p.says);
      // Every explanation names its certainty, what to do next time, and links its lesson.
      await expect(detail).toContainText('Holds whatever they held');
      await expect(option.first()).toHaveAccessibleName(p.severity);
      await expect(detail.getByText(/^Next time:/).first()).toBeVisible();
      await expect(detail.getByRole('link', { name: /\(L\d+\)/ }).first()).toBeVisible();
      await shot(page, info, `planted-${p.name}`);
    });
  }
});
