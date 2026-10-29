/**
 * The effect-script registry and coverage index (ARCHITECTURE §3, effect-dsl.md E-D1): one typed
 * `CardScript` per card number, from `cards/effects/<SET>/<CARD-ID>.ts`. The engine reads the
 * abilities from here; the app and the coverage report read the set of scripted ids.
 */
import type { CardScript } from '../src/dsl.ts';

const ALL: readonly CardScript[] = [];

export const SCRIPTS: Readonly<Record<string, CardScript>> = Object.fromEntries(
  ALL.map((s) => [s.cardId, s]),
);

/** Card numbers with a script, for coverage (`automation`) and the "effect not automated" badges. */
export const SCRIPTED_IDS: ReadonlySet<string> = new Set(Object.keys(SCRIPTS));
