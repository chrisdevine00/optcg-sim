/**
 * Differential guard for hotseat hidden information (review M3-39). Each pair is two positions
 * that differ only in hidden cards: the defender's hand, Life and deck, and the attacker's hand,
 * Life and deck. Hand, Life and deck sizes, the field and the seed are the same. Both are driven
 * through the same public inputs into every veiled state of a defence: the defender's [Trigger]-
 * free effect decision (OP17-048 Shiki's "trash a Rocks Pirates card from your hand" cost), the
 * Counter step and the damage decision. In each, the page's HTML, its aria snapshot and both live
 * regions must be identical. One fixed pair is the reviewer's case (a payable and an unpayable
 * hand); the rest are generated from a seeded RNG.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { nextDecision, serveArt } from './game-support.ts';

interface C {
  id: string;
  category: string;
  types: string[];
  effectText: string;
  triggerText: string | null;
  counter: number | null;
}
const dir = new URL('../../cards/data/sets/', import.meta.url);
const all: C[] = readdirSync(dir).flatMap(
  (f) => (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as { cards: C[] }).cards,
);
const ROCKS = all
  .filter((c) => c.category === 'Character' && c.types.includes('Rocks Pirates'))
  .map((c) => c.id)
  .sort();
const PLAIN = all
  .filter(
    (c) =>
      c.category === 'Character' &&
      !c.types.includes('Rocks Pirates') &&
      !c.types.includes('Animal Kingdom Pirates') &&
      !c.types.includes('Big Mom Pirates') &&
      !c.effectText &&
      !c.triggerText &&
      c.counter,
  )
  .map((c) => c.id)
  .sort();

/** mulberry32, so the generated pairs are the same on every run. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pickN = (r: () => number, from: string[], n: number) =>
  Array.from({ length: n }, () => from[Math.floor(r() * from.length)]!);

/** A defender hand of 4: with or without a Rocks Pirates card (that decides if Shiki is payable). */
function hand(r: () => number, rocks: boolean) {
  const h = pickN(r, PLAIN, 4);
  if (rocks) h[Math.floor(r() * 4)] = pickN(r, ROCKS, 1)[0]!;
  return h;
}

function position(r: () => number, rocks: boolean) {
  return {
    mode: 'hotseat',
    seed: 17,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      characters: ['OP17-048'],
      life: pickN(r, PLAIN, 3),
      hand: hand(r, rocks),
      deck: pickN(r, PLAIN, 10),
      costArea: { active: 2, rested: 0 },
    },
    p2: {
      leader: 'ST01-001',
      characters: ['OP01-023'],
      life: pickN(r, PLAIN, 2),
      hand: pickN(r, [...PLAIN, ...ROCKS], 2),
      deck: pickN(r, PLAIN, 10),
      costArea: { active: 0, rested: 2 },
    },
  };
}

const url = (spec: unknown) =>
  `./play?scenario=json:${Buffer.from(JSON.stringify(spec)).toString('base64url')}&speed=4&start=1`;

/** Everything a sighted user, a screen reader and the DOM show, with nothing per-run in it. */
async function snapshot(page: Page): Promise<string> {
  await page.waitForTimeout(250);
  const html = await page.evaluate(() => document.querySelector('main.play')!.outerHTML);
  const aria = await page.locator('main.play').ariaSnapshot();
  const live = await page.evaluate(
    () =>
      `${document.getElementById('announce-polite')?.textContent ?? ''}|${document.getElementById('announce-assertive')?.textContent ?? ''}`,
  );
  return [html, aria, live].join('\n----\n');
}

/** Drive one position to each veiled state; returns the snapshots in order. */
async function veiledStates(page: Page, spec: unknown): Promise<string[]> {
  await serveArt(page);
  await page.goto(url(spec));
  expect(await nextDecision(page)).toBe('main');
  await page.locator('[data-zone="my-chars"][data-glyph="attack"]').click();
  await page.locator('[data-zone="opp-row"].bc-leader').click();
  await page.locator('#confirm-attack').click();
  const out: string[] = [];
  // 1. Shiki's optional, veiled. Its cost reads the hand, so the panel must not know if it pays.
  expect(await nextDecision(page)).toBe('optional');
  await expect(page.locator('.hand-veil')).toBeVisible();
  out.push(await snapshot(page));
  await page.locator('#skip-btn').click();
  // 2. The Counter step, veiled.
  expect(await nextDecision(page)).toBe('counter');
  out.push(await snapshot(page));
  await page.locator('#take-hit').click();
  // 3. The damage decision, veiled.
  expect(await nextDecision(page)).toBe('trigger');
  out.push(await snapshot(page));
  return out;
}

async function comparePair(page: Page, a: unknown, b: unknown, label: string) {
  const sa = await veiledStates(page, a);
  const sb = await veiledStates(page, b);
  const names = ['Shiki optional', 'Counter step', 'damage decision'];
  sa.forEach((s, i) => expect(sb[i], `${label}: ${names[i]} differs`).toBe(s));
}

test.describe('veiled screens depend on public information only', () => {
  test.describe.configure({ mode: 'parallel' });
  test.beforeEach(() => {
    test.skip(test.info().project.name !== '720p', 'one pass is enough');
  });

  test('the reviewer’s pair: a payable and an unpayable Shiki cost', async ({ page }) => {
    const r1 = rng(1);
    const a = position(r1, true);
    const b = { ...a, p1: { ...a.p1, hand: hand(rng(2), false) } };
    await comparePair(page, a, b, 'fixed pair');
  });

  // M4a-01: OP07-077's take step after its [Trigger], with and without a match in the top 5.
  test('OP07-077: a match vs no match in the top 5', async ({ page }) => {
    const base = (match: boolean) => {
      const r = rng(77);
      const deck = pickN(r, PLAIN, 10);
      if (match) deck[2] = 'OP17-073'; // Basil Hawkins, Animal Kingdom Pirates
      return {
        mode: 'hotseat',
        seed: 21,
        turn: 4,
        activePlayer: 'p2',
        firstPlayer: 'p1',
        p1: {
          leader: 'OP17-058',
          life: ['OP07-077', ...pickN(r, PLAIN, 2)],
          hand: pickN(r, PLAIN, 4),
          deck,
          costArea: { active: 2, rested: 0 },
        },
        p2: {
          leader: 'ST01-001',
          characters: ['OP01-023'],
          life: pickN(r, PLAIN, 2),
          hand: pickN(r, PLAIN, 2),
          deck: pickN(r, PLAIN, 10),
          costArea: { active: 0, rested: 2 },
        },
      };
    };
    const takeStep = async (spec: unknown) => {
      await serveArt(page);
      await page.goto(url(spec));
      expect(await nextDecision(page)).toBe('main');
      await page.locator('[data-zone="my-chars"][data-glyph="attack"]').click();
      await page.locator('[data-zone="opp-row"].bc-leader').click();
      await page.locator('#confirm-attack').click();
      // Kaido's own optional first (skipped), then the Counter step, then the damage decision.
      expect(await nextDecision(page)).toBe('optional');
      await page.locator('#skip-btn').click();
      expect(await nextDecision(page)).toBe('counter');
      await page.locator('#take-hit').click();
      expect(await nextDecision(page)).toBe('trigger');
      // The defender shows their Life card, activates its [Trigger], and lets go of R.
      await page.keyboard.down('r');
      await page.locator('#trigger-activate').click();
      expect(await nextDecision(page)).toBe('choose');
      await page.keyboard.up('r');
      await expect(page.locator('.hand-veil')).toBeVisible();
      return snapshot(page);
    };
    const a = await takeStep(base(true));
    const b = await takeStep(base(false));
    expect(b, 'OP07-077 take step differs').toBe(a);
  });

  // 50 generated pairs in 10 batches, so the batches run in parallel.
  for (let batch = 0; batch < 10; batch++) {
    test(`generated pairs ${batch * 5 + 1}–${batch * 5 + 5}`, async ({ page }) => {
      test.setTimeout(240_000);
      for (let k = 0; k < 5; k++) {
        const n = batch * 5 + k;
        const r = rng(1000 + n);
        // Every other pair differs in whether the Shiki cost can be paid.
        const a = position(r, n % 2 === 0);
        const bAll = position(rng(5000 + n), n % 2 !== 0 || n % 4 === 1);
        // Same public facts: the field and the seed are fixed by `position`; sizes match.
        await comparePair(page, a, bAll, `pair ${n + 1}`);
      }
    });
  }
});
