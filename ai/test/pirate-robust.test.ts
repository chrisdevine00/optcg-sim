/**
 * Pirate must never throw or fall back on a decision while a battle names a card that has just
 * been K.O.'d (review M4b-04). The repros are full games over new-archetype pairings.
 */
import { describe, expect, it, vi } from 'vitest';
import { createGame, queries, type DeckSpec } from '@optcg/engine';
import { battleNumbers } from '../src/search/sim.ts';
import { metaDecks, lookup } from './support.ts';
import { playMatch } from './support/match.ts';

vi.setConfig({ testTimeout: 3_600_000 });

const decks = metaDecks();
const deckOf = (leader: string): DeckSpec => {
  const d = decks.find((x) => x.leader === leader);
  if (!d) throw new Error(`no meta list for ${leader}`);
  return d;
};

const REPROS: [number, string, string][] = [
  [1, 'OP17-079', 'OP14-041'],
  [2, 'OP08-098', 'OP13-001'],
  [3, 'OP14-041', 'OP13-004'],
];

describe('Pirate robustness (review M4b-04)', () => {
  it.each(REPROS)('seed %i: %s v %s finishes with no error and no fallback', (seed, a, b) => {
    const fallbacks: unknown[] = [];
    const onFallback = (e: unknown) => fallbacks.push(e);
    const r = playMatch({
      seed,
      decks: { p1: deckOf(a), p2: deckOf(b) },
      tiers: { p1: 'pirate', p2: 'pirate' },
      seats: { p1: { onFallback }, p2: { onFallback } },
    });
    expect(fallbacks.map(String)).toEqual([]);
    expect(r.capped).toBe(false);
  });

  it('battleNumbers returns null when the battle names a card that is gone', () => {
    const d = deckOf('OP17-079');
    const s = createGame({ seed: 1, cards: lookup, decks: { p1: d, p2: d } }).state;
    expect(battleNumbers(s)).toBeNull();
    const spy = vi
      .spyOn(queries, 'battle')
      .mockReturnValue({ attacker: '$gone', target: '$gone2' } as never);
    expect(battleNumbers(s)).toBeNull();
    spy.mockRestore();
  });
});

// Nightly / on demand: PIRATE_SWEEP=<games> plays that many full Pirate games over archetype
// pairings (each leader's first list, rotating opponents) and asserts 0 errors and 0 fallbacks.
const SWEEP = Number(process.env.PIRATE_SWEEP ?? 0);
describe.skipIf(SWEEP === 0)('Pirate sweep over archetype pairings', () => {
  it(`plays ${SWEEP} games with no error and no fallback`, () => {
    const leaders = [...new Set(decks.map((d) => d.leader))];
    const failures: string[] = [];
    const pairs: string[] = [];
    for (let g = 0; g < SWEEP; g++) {
      const a = leaders[g % leaders.length]!;
      const b =
        leaders[
          (g + 1 + (Math.floor(g / leaders.length) % (leaders.length - 1))) % leaders.length
        ]!;
      pairs.push(`${a} v ${b}`);
      const fallbacks: unknown[] = [];
      const onFallback = (e: unknown) => fallbacks.push(e);
      try {
        playMatch({
          seed: 100 + g,
          decks: { p1: deckOf(a), p2: deckOf(b) },
          tiers: { p1: 'pirate', p2: 'pirate' },
          seats: { p1: { onFallback }, p2: { onFallback } },
        });
      } catch (e) {
        failures.push(`${a} v ${b} seed ${100 + g}: ${String(e)}`);
      }
      for (const f of fallbacks)
        failures.push(`${a} v ${b} seed ${100 + g}: fallback ${String(f)}`);
    }
    console.log(`pirate sweep: ${SWEEP} games, ${new Set(pairs).size} distinct pairings`);
    expect(failures).toEqual([]);
  });
});
