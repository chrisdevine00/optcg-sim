/**
 * Hotseat hidden information (review M3-01..04): walk a game through curtains, a veiled defence,
 * the damage decision, after the defence, a rewind and game over. At every step, no hidden card
 * of a seat that is not revealed may appear in the page text (visible or not), in any attribute
 * (aria names, titles), in either live region, or in an open menu.
 */
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, startGame } from './game-support.ts';

const P1_PRIVATE = [
  'Vergo',
  'Krieg',
  'Bellamy',
  'Hajrudin',
  'Shinobu',
  'Jean Bart',
  'Wire',
  'Mocha',
];
const P2_PRIVATE = ['Fukurokuju', 'Atmos', 'Urashima', 'Babanuki', 'Mohji'];

/** Every string a sighted user, a screen reader or the DOM exposes. */
async function exposed(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts = [document.body.textContent ?? ''];
    for (const el of document.body.querySelectorAll('*'))
      for (const a of el.attributes)
        if (a.name !== 'style' && a.name !== 'class') parts.push(a.value);
    return parts.join('\n');
  });
}

async function expectHidden(page: Page, names: string[], step: string) {
  const text = await exposed(page);
  for (const n of names) expect(text.includes(n), `${step}: "${n}" is exposed`).toBe(false);
}

const curtain = (page: Page) => page.locator('.curtain button');

test('hotseat never exposes a seat’s hidden cards while it is not revealed', async ({ page }) => {
  test.setTimeout(120_000);
  await startGame(page, 'scenario=leak&speed=4');
  // 1. The first curtain: nobody's hand.
  await expect(curtain(page)).toBeVisible();
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'first curtain');
  // M3-07: focus stays in the curtain.
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(
      () =>
        !!document.activeElement?.closest('.curtain') || document.activeElement === document.body,
    ),
  ).toBe(true);
  await curtain(page).click();
  // 2. Player 2's Main Phase: their own hand only.
  await expect(page.getByRole('group', { name: /Player 2’s hand/ })).toContainText('Urashima');
  await expectHidden(page, P1_PRIVATE, 'attacker main');
  // 3. Player 2 attacks; Player 1 defends, veiled.
  await page.locator('[data-zone="my-row"].bc-leader').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  expect(await nextDecision(page)).toBe('block');
  await expect(page.locator('.hand-veil')).toBeVisible();
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'veiled defence');
  // The menu and rewind are closed to whoever is looking (M3-04, M3-24).
  await page.getByRole('button', { name: 'Game menu' }).click();
  await expect(page.getByRole('menuitem', { name: 'Rewind list…' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'menu during the veil');
  await page.keyboard.press('Escape');
  // 4. Hold R: Player 1's hand shows; Player 2's stays hidden. Stage two Counters.
  await page.keyboard.down('r');
  await expect(page.getByRole('group', { name: /Player 1’s hand/ })).toContainText('Hajrudin');
  await expectHidden(page, P2_PRIVATE, 'R held');
  await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
  await page.locator('[data-zone="hand"][data-glyph="play"]').first().click();
  // 5. Release R: the staged Counters are a count, not names (M3-03).
  await page.keyboard.up('r');
  await expect(page.locator('#decision')).toContainText('2 staged');
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'R released after staging');
  // 6. Take the hit (clear first); the damage decision stays veiled.
  await page.locator('#decision .lanehd button').click();
  await page.locator('#take-hit').click();
  expect(await nextDecision(page)).toBe('trigger');
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'veiled damage decision');
  await page.locator('#trigger-hand').click();
  // 7. Back to the attacker, hand veiled until they show it; the gained Life card stays private.
  expect(await nextDecision(page)).toBe('main');
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'after the defence');
  await page.locator('.hand-veil').click();
  await expect(page.getByRole('group', { name: /Player 2’s hand/ })).toContainText('Babanuki');
  await expectHidden(page, P1_PRIVATE, 'attacker shows their hand');
  // 8. End of turn: the curtain hides everything again.
  await page.locator('#endturn-btn').click();
  await expect(curtain(page)).toBeVisible();
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'second curtain');
  await curtain(page).click();
  expect(await nextDecision(page)).toBe('main');
  await expect(page.getByRole('group', { name: /Player 1’s hand/ })).toContainText('Vergo');
  await expectHidden(page, P2_PRIVATE, 'defender’s own turn');
  // 9. A rewind needs the other player's agreement; nothing private appears on the way.
  await page.locator('#decision-title').focus();
  await page.keyboard.press('u');
  await expect(page.getByRole('dialog', { name: 'Rewind for both players?' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(curtain(page)).toBeVisible();
  await expectHidden(page, [...P1_PRIVATE, ...P2_PRIVATE], 'curtain after the rewind');
  await curtain(page).click();
  await expectHidden(page, P1_PRIVATE, 'after the rewind');
  // 10. Game over by concession: still nothing of the other seat's.
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('menuitem', { name: 'Concede…' }).click();
  await page.getByRole('button', { name: 'Concede', exact: true }).click();
  expect(await nextDecision(page)).toBe('over');
  await expectHidden(page, P1_PRIVATE, 'game over');
});
