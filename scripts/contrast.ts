/**
 * WCAG 2.2 contrast check for the design tokens (docs/design/visual-system.md §7).
 * Parses the dark (:root) and light (:root[data-theme='light']) colour blocks of tokens.css and
 * checks every declared pair: text >= 4.5:1, non-text >= 3:1 (WCAG 1.4.3, 1.4.11).
 * Run by `npm run build` and by app/test/tokens.test.ts, so a failing pair fails CI.
 * Usage: tsx scripts/contrast.ts [path/to/tokens.css]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface PairResult {
  fg: string;
  bg: string;
  use: string;
  kind: 'text' | 'non-text';
  min: number;
  dark: number;
  light: number;
  pass: boolean;
}

type Palette = Record<string, string>;

function colourBlock(css: string, selector: RegExp): Palette {
  const m = css.match(selector);
  if (!m?.[1]) throw new Error(`Colour block not found: ${selector}`);
  const out: Palette = {};
  for (const d of m[1].matchAll(/--(color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[d[1]!] = d[2]!.toLowerCase();
  }
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
}

const SURFACES = ['color-bg', 'color-mat', 'color-surface-1', 'color-surface-2', 'color-surface-3'];
const TEXT_ON_SURFACES = [
  'color-text',
  'color-text-muted',
  'color-text-subtle',
  'color-accent-text',
  'color-opponent-text',
  'color-danger-text',
  'color-success-text',
  'color-warning-text',
];
const FILLS: [string, string, string][] = [
  ['color-on-accent', 'color-accent', 'primary button, "You" tag, legal badge'],
  ['color-on-accent', 'color-accent-hover', 'primary button hover'],
  ['color-on-opponent', 'color-opponent', '"Opponent" tag'],
  ['color-on-attack', 'color-attack', '"Attacking" chip, lethal banner'],
  ['color-on-success', 'color-success', '"Survives" chip'],
  ['color-on-warning', 'color-warning', 'warning chip'],
  ['color-on-don', 'color-don', 'DON!! token count'],
];
const PLATE_TEXT = [
  'color-plate-text',
  'color-plate-base',
  'color-plate-buff',
  'color-plate-debuff',
];
const NON_TEXT: [string, string, string][] = [
  ['color-accent', 'color-mat', 'legal-move ring on the mat'],
  ['color-accent', 'color-surface-2', 'legal ring / selected row in panels'],
  ['color-opponent', 'color-mat', 'opponent action highlight'],
  ['color-attack', 'color-mat', 'attack arrow'],
  ['color-focus', 'color-mat', 'focus ring on the mat'],
  ['color-focus', 'color-surface-1', 'focus ring in the rail'],
  ['color-focus', 'color-surface-2', 'focus ring in the decision panel'],
  ['color-focus', 'color-focus-gap', 'focus ring against its own gap'],
  ['color-line-strong', 'color-surface-1', 'secondary button / input boundary'],
  ['color-line-strong', 'color-surface-2', 'secondary button / input boundary'],
  ['color-line-strong', 'color-mat', 'control boundary on the mat'],
  ['color-don', 'color-mat', 'DON!! token on the mat'],
  ['color-don-rested', 'color-mat', 'rested DON!! token on the mat'],
  ['color-don', 'color-mat-zone', 'DON!! token in the cost-area zone'],
  ['color-don-rested', 'color-mat-zone', 'rested DON!! token in the cost-area zone'],
  ['color-accent', 'color-mat-zone', 'legal drop target on an empty slot'],
  ['color-success-text', 'color-surface-2', 'result icon'],
  ['color-warning-text', 'color-surface-2', 'warning icon'],
  ['color-danger-text', 'color-surface-2', 'danger icon'],
];

export function checkContrast(css: string): PairResult[] {
  const dark = colourBlock(
    css,
    /\/\* -+ Colour: dark \(default\) -+ \*\/\s*:root\s*\{([\s\S]*?)\n\}/,
  );
  const light = { ...dark, ...colourBlock(css, /:root\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/) };

  const pairs: Omit<PairResult, 'dark' | 'light' | 'pass'>[] = [];
  for (const fg of TEXT_ON_SURFACES) {
    for (const bg of SURFACES)
      pairs.push({ fg, bg, use: 'text on surface', kind: 'text', min: 4.5 });
  }
  for (const fg of ['color-text-muted', 'color-text-subtle']) {
    pairs.push({ fg, bg: 'color-mat-zone', use: 'empty-zone label', kind: 'text', min: 4.5 });
  }
  for (const [fg, bg, use] of FILLS) pairs.push({ fg, bg, use, kind: 'text', min: 4.5 });
  for (const fg of PLATE_TEXT)
    pairs.push({ fg, bg: 'color-plate', use: 'card badge', kind: 'text', min: 4.5 });
  for (const [fg, bg, use] of NON_TEXT) pairs.push({ fg, bg, use, kind: 'non-text', min: 3 });

  return pairs.map((p) => {
    for (const name of [p.fg, p.bg]) {
      if (!dark[name] || !light[name])
        throw new Error(`Token --${name} is missing from tokens.css`);
    }
    const d = contrastRatio(dark[p.fg]!, dark[p.bg]!);
    const l = contrastRatio(light[p.fg]!, light[p.bg]!);
    return { ...p, dark: d, light: l, pass: d >= p.min && l >= p.min };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file =
    process.argv[2] ?? fileURLToPath(new URL('../app/src/styles/tokens.css', import.meta.url));
  const results = checkContrast(readFileSync(file, 'utf8'));
  const failures = results.filter((r) => !r.pass);
  for (const f of failures) {
    console.error(
      `FAIL --${f.fg} on --${f.bg} (${f.use}): dark ${f.dark.toFixed(2)}, light ${f.light.toFixed(2)}, need ${f.min}:1`,
    );
  }
  console.log(`Contrast: ${results.length} pairs checked, ${failures.length} failing.`);
  process.exit(failures.length ? 1 : 0);
}
