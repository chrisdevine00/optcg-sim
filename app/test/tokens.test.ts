import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkContrast, contrastRatio } from '../../scripts/contrast.ts';

const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

describe('design tokens (visual-system.md §7)', () => {
  it('computes WCAG contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('every declared pair meets WCAG 2.2 AA in both themes', () => {
    const results = checkContrast(tokens);
    expect(results.length).toBeGreaterThanOrEqual(72);
    expect(results.filter((r) => !r.pass)).toEqual([]);
  });

  it('never sets text below the 12px floor', () => {
    const sizes = [...tokens.matchAll(/--text-[a-z0-9]+:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  });
});
