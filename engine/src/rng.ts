/**
 * Seeded PRNG (mulberry32). The state is a single uint32 kept inside game state,
 * so every random outcome is reproducible from `{ seed, actions[] }`.
 */
export type RngState = number;

export function seedRng(seed: number): RngState {
  return seed >>> 0;
}

/** Returns a float in [0, 1) and the next RNG state. */
export function nextFloat(state: RngState): [number, RngState] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Returns an integer in [0, n) and the next RNG state. */
export function nextInt(state: RngState, n: number): [number, RngState] {
  const [f, s] = nextFloat(state);
  return [Math.floor(f * n), s];
}

/** Fisher–Yates shuffle; returns a new array and the next RNG state. */
export function shuffle<T>(items: readonly T[], state: RngState): [T[], RngState] {
  const out = items.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    let j: number;
    [j, s] = nextInt(s, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return [out, s];
}
