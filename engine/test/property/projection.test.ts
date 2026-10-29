/**
 * Projection indistinguishability (ARCHITECTURE §2.7, ADR 0005): two states that differ only by a
 * permutation of cards hidden from a player project identically for that player.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { project, type GameState, type PlayerId } from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import type { State } from '../../src/state.ts';
import { playRandomGame } from '../support/random-game.ts';

const RUNS = Math.max(40, Math.ceil(Number(process.env.ENGINE_GAMES ?? 500) / 10));

/** Ids of cards `viewer` cannot see (excluding a Life card being checked for [Trigger]). */
function hiddenFrom(s: State, viewer: PlayerId): string[] {
  const out: string[] = [];
  for (const p of ['p1', 'p2'] as const) {
    const ps = s.players[p];
    out.push(...ps.deck);
    if (p !== viewer) out.push(...ps.hand);
    const pending = s.decision?.kind === 'trigger' ? ps.life[0] : undefined;
    out.push(...ps.life.filter((id) => !s.cards[id]!.faceUp && id !== pending));
  }
  return out;
}

/** Permute the printed card ids among the hidden instances (positions, ids and keys stay). */
function permute(s: State, ids: string[], order: number[]): GameState {
  const cards = { ...s.cards };
  const printed = ids.map((id) => s.cards[id]!.card);
  ids.forEach((id, i) => {
    cards[id] = { ...cards[id]!, card: printed[order[i]! % printed.length]! };
  });
  // Only permute within one owner, so ownership facts stay true.
  return { ...s, cards } as unknown as GameState;
}

describe('projection linkage leak test', () => {
  it('states differing by a hidden permutation project identically', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 0x7fffffff }),
        fc.nat(),
        fc.constantFrom<PlayerId>('p1', 'p2'),
        fc.array(fc.nat(), { minLength: 120, maxLength: 120 }),
        (seed, at, viewer, order) => {
          const game = playRandomGame({ seed, keepStates: true, invariants: false });
          const g = game.states[at % game.states.length]!;
          const s = internals(g);
          for (const owner of ['p1', 'p2'] as const) {
            const ids = hiddenFrom(s, viewer).filter((id) => s.cards[id]!.owner === owner);
            if (ids.length < 2) continue;
            // Sort `order` into a permutation of the hidden positions.
            const perm = ids
              .map((_, i) => i)
              .sort((x, y) => (order[x] ?? 0) - (order[y] ?? 0) || x - y);
            const other = permute(s, ids, perm);
            expect(JSON.stringify(project(other, viewer))).toBe(JSON.stringify(project(g, viewer)));
          }
        },
      ),
      { numRuns: RUNS, seed: 0xc0ffee },
    );
  });

  it('a change the viewer can see does change the view (the test has teeth)', () => {
    const game = playRandomGame({ seed: 99, keepStates: true, invariants: false });
    const g = game.states[20]!;
    const s = internals(g);
    const own = s.players.p1.hand;
    if (own.length >= 1) {
      const cur = s.cards[own[0]!]!.card;
      const swap = Object.keys(s.defs).find(
        (id) => id !== cur && s.defs[id]!.category !== 'Leader',
      )!;
      const cards = { ...s.cards, [own[0]!]: { ...s.cards[own[0]!]!, card: swap } };
      const changed = { ...s, cards } as unknown as GameState;
      expect(JSON.stringify(project(changed, 'p1'))).not.toBe(JSON.stringify(project(g, 'p1')));
      expect(JSON.stringify(project(changed, 'p2'))).toBe(JSON.stringify(project(g, 'p2')));
    }
  });
});
