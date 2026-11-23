/**
 * The effect-script registry (ARCHITECTURE §3, effect-dsl.md E-D1): one typed `CardScript` per card
 * number, from `cards/effects/<SET>/<CARD-ID>.ts`.
 *
 * Scripts load per set (PLAN §2a M6b-0): `SCRIPTED_IDS` is known without loading anything (for
 * coverage badges), and `SCRIPTS` fills as `loadScripts` loads the sets a game needs. Every reader of
 * `SCRIPTS` runs after its game's `loadScripts`; the engine refuses to build a scripted card whose
 * script is not loaded, so a missed load fails loudly instead of playing the card as vanilla.
 * `cards/effects/registry.ts` and each set's `index.ts` are generated (`npm run cards:effects-index`).
 */
import type { CardScript } from '../src/dsl.ts';
import { setCodeOf } from '../src/format.ts';
import { SCRIPTED_ID_LIST, SET_LOADERS } from './registry.ts';

const table: Record<string, CardScript> = {};

/** Loaded scripts by card number. Read it only after `loadScripts` for the cards in question. */
export const SCRIPTS: Readonly<Record<string, CardScript>> = table;

/** Card numbers with a script, for coverage (`automation`) and the "effect not automated" badges. */
export const SCRIPTED_IDS: ReadonlySet<string> = new Set(SCRIPTED_ID_LIST);

const sets = new Map<string, Promise<void>>();

function loadSet(set: string): Promise<void> {
  let p = sets.get(set);
  if (!p) {
    const loader = SET_LOADERS[set];
    p = loader
      ? loader().then((m) => {
          for (const s of m.default) table[s.cardId] = s;
        })
      : Promise.resolve();
    // A failed chunk load (offline) may be retried by the next call.
    p.catch(() => sets.delete(set));
    sets.set(set, p);
  }
  return p;
}

const setOf = (id: string): string | null => {
  try {
    return setCodeOf(id);
  } catch {
    return null;
  }
};

/** Loads the scripts of these card numbers (their whole sets). Unscripted or unknown ids are ignored. */
export async function loadScripts(ids: Iterable<string>): Promise<void> {
  const wanted = new Set<string>();
  for (const id of ids) {
    if (!SCRIPTED_IDS.has(id)) continue;
    const set = setOf(id);
    if (set) wanted.add(set);
  }
  await Promise.all([...wanted].map(loadSet));
}

/** Loads every script (tests, tools, the card-suite runner). */
export async function loadAllScripts(): Promise<void> {
  await Promise.all(Object.keys(SET_LOADERS).map(loadSet));
}

/** True when the card is unscripted or its script is loaded. */
export const scriptReady = (id: string): boolean => !SCRIPTED_IDS.has(id) || id in table;
