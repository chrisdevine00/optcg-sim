/**
 * M10 WP0: the document head and the first frame (WP6 extends this file with the checks that the icon,
 * apple-touch-icon and manifest links resolve). The first frame before React mounts is painted from
 * two values the inline style copies from tokens.css; this keeps them equal. Revert: change either
 * value in index.html or tokens.css and the match test fails.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCsp, withCsp } from '../../scripts/csp.ts';

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
  // M10-R8: image requests carry no Referer. Revert: delete the tag or set another policy.
  it('sends no referrer, before the first request the page makes', () => {
    expect(html).toMatch(/<meta\s+name="referrer"\s+content="no-referrer"\s*\/>/);
    expect(html.indexOf('name="referrer"')).toBeLessThan(html.indexOf('<script'));
    expect(withCsp(html)).toContain('name="referrer" content="no-referrer"');
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
  it('links the icon, apple-touch-icon and manifest to files the build copies from app/public', () => {
    const hrefs = [
      ...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)" href="([^"]+)"/g),
    ].map((m) => m[1]!);
    expect(hrefs).toHaveLength(3);
    for (const href of hrefs) {
      expect(href.startsWith('%BASE_URL%'), href).toBe(true);
      const file = new URL(`../public/${href.slice('%BASE_URL%'.length)}`, import.meta.url);
      expect(existsSync(file), href).toBe(true);
    }
  });
});

describe('manifest.webmanifest', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
  ) as {
    name: string;
    short_name: string;
    start_url: string;
    scope: string;
    display: string;
    background_color: string;
    theme_color: string;
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
  };
  it('names the app and starts under the base (relative paths only)', () => {
    expect(manifest.name).toBe('OPTCG Sim');
    expect(manifest.short_name).toBe('OPTCG Sim');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
  });
  it('takes its colours from the tokens', () => {
    expect(manifest.background_color.toLowerCase()).toBe(token(':root', '--color-bg'));
    expect(manifest.theme_color.toLowerCase()).toBe(token(':root', '--color-bg'));
  });
  it('lists 192 and 512 icons and a maskable one, each a PNG of the stated size, relative paths', () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/') || icon.src.includes('://'), icon.src).toBe(false);
      const png = readFileSync(new URL(`../public/${icon.src}`, import.meta.url));
      expect(png.subarray(1, 4).toString(), icon.src).toBe('PNG');
      const [w, h] = icon.sizes.split('x').map(Number);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], icon.src).toEqual([w, h]);
    }
  });
  it('ships a 180 px apple-touch-icon', () => {
    const png = readFileSync(new URL('../public/apple-touch-icon.png', import.meta.url));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
  });
  it('draws the favicon as our own vector mark: no embedded image, no text, no font', () => {
    const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/<image|<text|font-family|href=/);
  });
});

/**
 * The Content-Security-Policy is built from the art hosts the app uses and written into the built
 * page (scripts/csp.ts). Revert: hard-code a host, or drop the filter on `enabled`, and the first
 * and third tests fail; insert the tag after `</head>` and the second fails.
 */
describe('Content-Security-Policy', () => {
  it('allows only the enabled image hosts, and nothing else off-site', () => {
    const csp = buildCsp({
      a: { base: 'https://img.example/x/', enabled: true },
      b: { base: 'https://off.example/y/', enabled: false },
    });
    expect(csp).toContain("img-src 'self' data: blob: https://img.example");
    expect(csp).not.toContain('off.example');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-(?:inline|eval)'/);
  });
  it('is the first thing in <head> and is written once', () => {
    const out = withCsp(html);
    expect(out).toMatch(/<head>\s*<meta http-equiv="Content-Security-Policy"/);
    expect(withCsp(out)).toBe(out);
  });
  it("matches the app's real image sources", async () => {
    const { IMAGE_SOURCES } = await import('../src/art/sources.ts');
    const csp = buildCsp();
    for (const s of Object.values(IMAGE_SOURCES)) {
      expect(csp.includes(new URL(s.base).origin), s.base).toBe(s.enabled);
    }
  });
});
