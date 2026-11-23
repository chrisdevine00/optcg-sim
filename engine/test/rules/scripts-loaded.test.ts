/** Scripts load per set (M6b-0): the engine never builds a scripted card whose script is not loaded. */
import { describe, expect, it } from 'vitest';
import { SCRIPTS, scriptReady } from '@optcg/cards';
import { createGame } from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from '../support/decks.ts';

describe('script loading', () => {
  it('a game with a scripted card whose script is missing fails loudly, and builds once it is loaded', () => {
    const deck = metaDecks().find((d) => d.leader === 'OP17-039')!;
    const table = SCRIPTS as Record<string, (typeof SCRIPTS)[string]>;
    const id = 'OP17-040';
    const keep = table[id]!;
    delete table['OP17-040'];
    try {
      expect(scriptReady(id)).toBe(false);
      expect(() => createGame({ seed: 1, decks: { p1: deck, p2: deck }, cards: cards() })).toThrow(
        /effect script of OP17-040 is not loaded/,
      );
    } finally {
      table[id] = keep;
    }
    expect(scriptReady(id)).toBe(true);
    expect(
      createGame({ seed: 1, decks: { p1: deck, p2: deck }, cards: cards() }).state,
    ).toBeTruthy();
  });
});
