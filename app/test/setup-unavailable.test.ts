/**
 * M10 WP7 (review N-4): when a set's card data fails to load (a network failure), Setup says
 * "Card unavailable (OP17-039)" and offers a retry; it never reports every card as "Unknown card".
 * A card that really is not in the data (a mistyped number) is still an unknown card.
 *
 * Revert, failing the first and third tests: make `loadCardsReport` count every rejected set as
 * missing (drop the `Unknown set` test), or have `checkSetupDeck` ignore `unavailable`.
 */
import { describe, expect, it, vi } from 'vitest';
import { checkSetupDeck, unavailableText } from '../src/play/setup/check.ts';

vi.mock('@optcg/cards/browser', async (orig) => {
  const real = await orig<typeof import('@optcg/cards/browser')>();
  return {
    ...real,
    // The loader that fails: OP-17 never arrives; every other set loads as usual.
    loadSet: (code: string) =>
      code === 'OP-17' ? Promise.reject(new TypeError('Failed to fetch')) : real.loadSet(code),
  };
});

const { loadCardsReport } = await import('../src/play/setup/decks.ts');

const spec = { leader: 'OP17-039', main: Array.from({ length: 50 }, () => 'OP17-040') };

describe('a failing card loader is "unavailable", not "unknown" (N-4)', () => {
  it('names the cards whose set did not load', async () => {
    const r = await loadCardsReport(['OP17-039', 'OP17-040', 'OP01-001']);
    expect([...r.unavailable].sort()).toEqual(['OP17-039', 'OP17-040']);
    expect(r.cards.has('OP01-001')).toBe(true);
  });

  it('a card in a set that does not exist stays an unknown card', async () => {
    const r = await loadCardsReport(['OP99-001']);
    expect(r.unavailable.size).toBe(0);
    expect(r.cards.size).toBe(0);
    const c = checkSetupDeck({ leader: 'OP99-001', main: [] }, r.cards, r.unavailable, 'standard');
    expect(c.unavailable).toEqual([]);
    expect(c.problems.join(' ')).toContain('Unknown Leader card OP99-001');
  });

  it('Setup shows "Card unavailable (id)" and no "Unknown card" for any of them', async () => {
    const r = await loadCardsReport([spec.leader, ...spec.main]);
    const c = checkSetupDeck(spec, r.cards, r.unavailable, 'standard');
    expect(c.problems).toEqual([]);
    expect(c.unavailable).toEqual(['OP17-039', 'OP17-040']);
    expect(unavailableText(c.unavailable)).toEqual([
      'Card unavailable (OP17-039)',
      'Card unavailable (OP17-040)',
    ]);
  });

  it('a long list is cut to three with a count', () => {
    const ids = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
    expect(unavailableText(ids)).toEqual([
      'Card unavailable (A-1)',
      'Card unavailable (A-2)',
      'Card unavailable (A-3)',
      'and 2 more cards unavailable',
    ]);
  });
});
