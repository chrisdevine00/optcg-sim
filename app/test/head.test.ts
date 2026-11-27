/**
 * M10 WP0: the document head and the first frame (WP6 extends this file with the checks that the icon,
 * apple-touch-icon and manifest links resolve). The first frame before React mounts is painted from
 * two values the inline style copies from tokens.css; this keeps them equal. Revert: change either
 * value in index.html or tokens.css and the match test fails.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/** A custom property's value in the first block with the selector (`:root`, `:root[data-theme='light']`). */
function token(selector: string, name: string): string {
  const open = tokens.indexOf(`${selector} {`);
  expect(open, `${selector} block`).toBeGreaterThanOrEqual(0);
  const block = tokens.slice(open, tokens.indexOf('}', open));
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  expect(m, `${name} in ${selector}`).not.toBeNull();
  return m![1]!.toLowerCase();
}

describe('index.html head', () => {
  it('has the language, description, both theme colours, icons, manifest and og tags', () => {
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{40,}"/);
    expect(html).toMatch(/name="theme-color"[^>]*media="\(prefers-color-scheme: dark\)"/);
    expect(html).toMatch(/name="theme-color"[^>]*media="\(prefers-color-scheme: light\)"/);
    expect(html).toContain('<link rel="icon" href="%BASE_URL%favicon.svg"');
    expect(html).toContain('<link rel="apple-touch-icon"');
    expect(html).toContain('<link rel="manifest"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toMatch(/<noscript>[^<]+<\/noscript>/);
  });
  it('leaves #root empty: no boot line (M10 WP1: it only moved LCP later; the inline background is the first frame)', () => {
    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('Loading OPTCG Sim');
  });
  it('paints the first frame from the tokens: inline background and text equal --color-bg and --color-text', () => {
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    const bg = /background:\s*(#[0-9a-fA-F]+)/.exec(style)?.[1]?.toLowerCase();
    const fg = /(?:^|[\s;{])color:\s*(#[0-9a-fA-F]+)/.exec(style)?.[1]?.toLowerCase();
    expect(bg).toBe(token(':root', '--color-bg'));
    expect(fg).toBe(token(':root', '--color-text'));
  });
  it('gives the browser chrome the same colours as the page in both schemes', () => {
    const dark = /content="(#[0-9a-fA-F]+)" media="\(prefers-color-scheme: dark\)"/.exec(html)?.[1];
    const light = /content="(#[0-9a-fA-F]+)" media="\(prefers-color-scheme: light\)"/.exec(
      html,
    )?.[1];
    expect(dark?.toLowerCase()).toBe(token(':root', '--color-bg'));
    expect(light?.toLowerCase()).toBe(token(":root[data-theme='light']", '--color-bg'));
  });
  it.todo('the icon, apple-touch-icon and manifest links resolve to files in the build (WP6)');
});
