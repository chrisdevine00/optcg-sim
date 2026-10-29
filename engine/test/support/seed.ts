/**
 * Property-test seeds (M2-11). Every push uses fixed seeds, so CI is reproducible. The nightly run
 * (ENGINE_GAMES set) draws a new base seed each run, so it explores new games, logs it and writes
 * it to test-results/property-seed.json.
 * Reproduce a nightly failure with PROPERTY_SEED=<logged seed>.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const fromEnv = process.env.PROPERTY_SEED;
const nightly = process.env.ENGINE_GAMES !== undefined;

export const BASE_SEED: number =
  fromEnv !== undefined ? Number(fromEnv) >>> 0 : nightly ? Date.now() % 0x7fffffff : 0x5eed;

let logged = false;
/** The fast-check seed for one property, derived from the base seed. */
export function propertySeed(offset: number): number {
  if (!logged) {
    logged = true;
    console.info(`[engine property] PROPERTY_SEED=${BASE_SEED}`);
    // A passing run hides console output, so nightly runs also write the seed to a file that the
    // workflow uploads with its results (M2-21).
    if (nightly || fromEnv !== undefined) {
      mkdirSync('test-results', { recursive: true });
      writeFileSync(
        'test-results/property-seed.json',
        JSON.stringify({ PROPERTY_SEED: BASE_SEED, games: process.env.ENGINE_GAMES ?? null }) +
          '\n',
      );
    }
  }
  return (BASE_SEED + offset) | 0;
}
