/** Per-set script chunks (M6b-0): the generated registry is current and every script is in its set. */
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { setCodeOf } from '../src/format.ts';
import { SCRIPTS, SCRIPTED_IDS, scriptReady } from '../effects/index.ts';
import { SET_LOADERS } from '../effects/registry.ts';
import { stale } from '../scripts/effects-index.ts';

describe('effect script registry', () => {
  it('registry.ts and every set index.ts are current (run npm run cards:effects-index)', async () => {
    expect(await stale()).toEqual([]);
  });

  it('every script sits in its own set folder, under its own card number', async () => {
    for (const [set, load] of Object.entries(SET_LOADERS))
      for (const s of (await load()).default) expect(setCodeOf(s.cardId), s.cardId).toBe(set);
  });

  it('SCRIPTED_IDS matches the loaded table, and the effects folder holds only the registry', () => {
    // The test setup loads every set.
    expect([...SCRIPTED_IDS].sort()).toEqual(Object.keys(SCRIPTS).sort());
    for (const id of SCRIPTED_IDS) expect(scriptReady(id)).toBe(true);
    const loose = readdirSync(new URL('../effects/', import.meta.url)).filter((f) =>
      f.endsWith('.ts'),
    );
    expect(loose.sort()).toEqual(['index.ts', 'registry.ts']);
  });
});
