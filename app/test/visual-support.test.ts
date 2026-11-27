/**
 * M10 WP8: the harness of the pixel specs (app/e2e/visual). These are the guards that keep Bandai art
 * out of a baseline and the baseline directory honest; the pixel comparison itself is nightly.
 *
 * Reverts, each failing a test here: hard-code `ART_ORIGINS` to one host (the route list no longer
 * covers `IMAGE_SOURCES`); commit a JPEG, an oversized or misnamed file under `__visual__`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMAGE_SOURCES } from '../src/art/sources.ts';
import { abortArt, artRoute, ART_ORIGINS } from '../e2e/visual/support.ts';

const E2E = join(__dirname, '..', 'e2e');
const BASELINES = join(E2E, '__visual__');
// Screenshots of a dense board are 150 to 500 KB as PNG; 600 KB catches a photo or a card scan.
const MAX_BYTES = 600 * 1024;

const specNames = [
  ...readFileSync(join(E2E, 'visual', 'screens.spec.ts'), 'utf8').matchAll(
    /^\s+name: '(\d\d-[a-z-]+)',$/gm,
  ),
].map((m) => m[1]!);

describe('every art host is aborted', () => {
  it('routes each IMAGE_SOURCES origin (enabled or not) to an abort', async () => {
    const routed: string[] = [];
    const aborted: string[] = [];
    const page = {
      route: (glob: string, handler: (r: { abort: () => void }) => void) => {
        routed.push(glob);
        handler({ abort: () => aborted.push(glob) });
        return Promise.resolve();
      },
    };
    await abortArt(page as never);
    for (const s of Object.values(IMAGE_SOURCES)) {
      const glob = artRoute(new URL(s.base).origin);
      expect(routed, `${s.base} must be routed in app/e2e/visual/support.ts`).toContain(glob);
      expect(aborted, `${s.base} must be aborted, not served`).toContain(glob);
    }
    expect(ART_ORIGINS.length).toBe(Object.keys(IMAGE_SOURCES).length);
  });
});

describe('the baseline directory', () => {
  it('the spec names the PROMPT five first', () => {
    expect(specNames.slice(0, 5)).toEqual([
      '01-board-explore',
      '02-inspector',
      '03-coach-lethal',
      '04-review-timeline',
      '05-meta-tiles',
    ]);
  });

  it('holds only spec-named PNG files, one folder per project, each under the size cap', () => {
    if (!existsSync(BASELINES)) return; // before the first baselines are committed
    for (const p of readdirSync(BASELINES, { withFileTypes: true })) {
      expect(p.isDirectory(), `${p.name}: only project folders belong in __visual__`).toBe(true);
      expect(['720p', '1080p']).toContain(p.name);
      for (const f of readdirSync(join(BASELINES, p.name))) {
        const file = join(BASELINES, p.name, f);
        expect(f.endsWith('.png'), `${p.name}/${f}: only .png files`).toBe(true);
        expect(specNames, `${p.name}/${f}: not produced by a spec name`).toContain(
          f.replace(/\.png$/, ''),
        );
        expect(statSync(file).size, `${p.name}/${f}: over the size cap`).toBeLessThanOrEqual(
          MAX_BYTES,
        );
        // A real PNG by its signature, so a renamed photo is caught by its bytes as well.
        expect([...readFileSync(file).subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
      }
    }
  });
});
