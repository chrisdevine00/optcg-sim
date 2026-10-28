/**
 * Browser entry point (`@optcg/cards/browser`): the manifest, and each set's card JSON loaded on demand
 * as its own lazy chunk. Uses the bundler's `import.meta.glob` (Vite and Vitest), so Node scripts must
 * not import this module; they read `data/` directly.
 */
import type { Manifest, SetFile } from './schema.ts';
import manifestJson from '../data/manifest.json';

export const manifest = manifestJson as Manifest;

const loaders = import.meta.glob<SetFile>('../data/sets/*.json', { import: 'default' });
const cache = new Map<string, Promise<SetFile>>();

/** Loads one set's cards (`OP-17`, `ST-01`, `P`). Each set is fetched once per page load. */
export function loadSet(code: string): Promise<SetFile> {
  let p = cache.get(code);
  if (!p) {
    const load = loaders[`../data/sets/${code}.json`];
    if (!load) return Promise.reject(new Error(`Unknown set ${code}`));
    p = load();
    cache.set(code, p);
  }
  return p;
}
