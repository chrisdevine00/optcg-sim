/**
 * M6: "a non-meta-leader deck can be played against the AI" (PLAN M6). A deck built in the builder
 * may have any Leader: the AI has no archetype prior for it (its guesses of the hidden cards fall
 * back to what it has seen, padded from its own list) and no playbook when it plays one. Both ways
 * must finish a game with no fallback and no determinization failure.
 */
import { describe, expect, it } from 'vitest';
import type { DeckSpec } from '@optcg/engine';
import { deckErrors } from '@optcg/engine';
import { cardMap, lookup, metaDecks } from './support.ts';
import { playMatch } from './support/match.ts';

const META_LEADERS = new Set(metaDecks().map((d) => d.leader));

/** A Standard-legal deck around a non-meta Leader: four copies each of its colours' Characters. */
function nonMetaDeck(): DeckSpec {
  const all = [...cardMap().values()];
  const legal = (id: string) => cardMap().get(id)!.legality.standard.status === 'legal';
  for (const leader of all.filter(
    (c) =>
      c.category === 'Leader' &&
      !META_LEADERS.has(c.id) &&
      c.colors.length === 1 &&
      legal(c.id) &&
      c.set.startsWith('OP-1'),
  )) {
    const pool = all
      .filter(
        (c) =>
          c.category === 'Character' &&
          c.colors.every((x) => leader.colors.includes(x)) &&
          legal(c.id) &&
          !c.legality.standard.bannedWith,
      )
      .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || (a.id < b.id ? -1 : 1));
    if (pool.length < 13) continue;
    // A curve: every other card from the cost-sorted pool, so low and high costs both appear.
    const picks = pool.filter((_, i) => i % Math.floor(pool.length / 13) === 0).slice(0, 13);
    const main = picks.flatMap((c) => [c.id, c.id, c.id, c.id]).slice(0, 50);
    const deck = { leader: leader.id, main };
    if (main.length === 50 && deckErrors(deck, lookup, 'standard').length === 0) return deck;
  }
  throw new Error('No non-meta Leader with a legal 50-card deck found.');
}

describe('M6: a deck with a non-meta Leader against the AI', () => {
  const mine = nonMetaDeck();
  const rocks = metaDecks().find((d) => d.leader === 'OP17-039')!;
  const strict = {
    onFallback: (e: unknown) => {
      throw e;
    },
    onCannotDeterminize: () => {
      throw new Error('CannotDeterminize');
    },
  };

  it(`the deck (${mine.leader}) is non-meta and Standard-legal`, () => {
    expect(META_LEADERS.has(mine.leader)).toBe(false);
    expect(deckErrors(mine, lookup, 'standard')).toEqual([]);
  });

  for (const tier of ['pirate', 'warlord'] as const) {
    it(`${tier} plays a full game against it (no prior for the opponent)`, () => {
      const r = playMatch({
        seed: 6001,
        decks: { p1: mine, p2: rocks },
        tiers: { p1: 'rookie', p2: tier },
        seats: { p2: strict },
      });
      expect(r.capped).toBe(false);
      expect(r.result).not.toBeNull();
    }, 180_000);
    it(`${tier} plays a full game with it (no playbook)`, () => {
      const r = playMatch({
        seed: 6002,
        decks: { p1: rocks, p2: mine },
        tiers: { p1: 'pirate', p2: tier },
        seats: { p1: strict, p2: strict },
      });
      expect(r.capped).toBe(false);
      expect(r.result).not.toBeNull();
    }, 180_000);
  }
});
