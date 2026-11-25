/**
 * M6b wave 6, G49: what the printed text says a card has (cards/src/printed.ts). Read from the
 * verified card data, never from the script, so an unscripted card reads like a scripted one.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasBaseEffectText, printedTimings } from '../src/printed.ts';
import type { Card, SetFile } from '../src/schema.ts';

const dir = new URL('../data/sets/', import.meta.url);
const all: Card[] = readdirSync(dir).flatMap(
  (f) => (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile).cards,
);
const byId = new Map(all.map((c) => [c.id, c]));
const card = (id: string): Card => byId.get(id)!;
const base = (id: string): boolean => hasBaseEffectText(card(id).effectText, card(id).triggerText);

describe('printed text', () => {
  it('a card with no text has no base effect', () => {
    expect(base('EB01-005')).toBe(false);
    expect(hasBaseEffectText('', null)).toBe(false);
    expect(hasBaseEffectText('', '')).toBe(false);
    expect(hasBaseEffectText('-', null)).toBe(false);
  });

  it('keywords and their reminder text are not a base effect (M6b-Q29)', () => {
    expect(base('EB01-017')).toBe(false); // [Blocker]
    expect(base('OP01-025')).toBe(false); // [Rush]
    expect(
      hasBaseEffectText(
        '[Double Attack] (This card deals 2 damage.)\n[Banish] (When this card deals damage, the target card is trashed without activating its Trigger.)',
        null,
      ),
    ).toBe(false);
    expect(
      hasBaseEffectText(
        '[Rush: Character] (This card can attack Characters on the turn it is played.)',
        null,
      ),
    ).toBe(false);
  });

  it('any other text, or a [Trigger], is a base effect (M6b-Q70)', () => {
    expect(base('EB01-015')).toBe(true); // [On Play]
    expect(base('OP01-009')).toBe(true); // only a [Trigger]
    expect(hasBaseEffectText('[Blocker] (reminder)\n[On K.O.] Draw 1 card.', null)).toBe(true);
    expect(hasBaseEffectText('[Your Turn] This Character gains +1000 power.', null)).toBe(true);
  });

  it('reads the printed timings, once each', () => {
    expect(printedTimings('')).toEqual([]);
    expect(printedTimings(card('EB01-015').effectText)).toEqual(['onPlay']);
    expect(printedTimings(card('EB01-004').effectText)).toEqual(['whenAttacking']);
    expect(printedTimings(card('EB01-003').effectText)).toEqual(['whenAttacking']); // [Rush] is not one
    expect(
      printedTimings(
        "[On Play] Draw 1.[When Attacking]/[On Your Opponent's Attack] Draw 1.\n[Activate:Main] Rest this.\n[On K.O.] [On Play] Draw 1.",
      ).sort(),
    ).toEqual(['activateMain', 'onKO', 'onOpponentAttack', 'onPlay', 'whenAttacking']);
    expect(printedTimings('[Activate: Main] Draw 1.')).toEqual(['activateMain']);
    expect(printedTimings('[End of Your Turn] x [End of Your Opponent’s Turn] y').sort()).toEqual([
      'endOfOpponentsTurn',
      'endOfYourTurn',
    ]);
  });

  it('a name in brackets is not a timing, and a keyword is not one either', () => {
    expect(printedTimings('Play [Sanji] from your trash. [Blocker] [Rush]')).toEqual([]);
  });

  it('agrees with the card data for the audit cards that need it', () => {
    // EB03-003 plays "no base effect" cards; its own text is not one.
    expect(base('EB03-003')).toBe(true);
    expect(printedTimings(card('PRB01-001').effectText)).toEqual(['activateMain']);
    expect(printedTimings(card('EB03-001').effectText)).toEqual(['activateMain']);
  });

  it('every card with an [On Play] in its text prints it, and no other does', () => {
    for (const c of all) {
      const says = /\[On Play\](?!\s*effect)/i.test(c.effectText);
      expect(printedTimings(c.effectText).includes('onPlay'), c.id).toBe(says);
    }
  });

  it('every card with no text and no [Trigger] has no base effect, and every card with text has one unless it is only keywords', () => {
    for (const c of all) {
      if (!c.effectText.trim() && !c.triggerText) expect(base(c.id), c.id).toBe(false);
      if (/\[(On Play|When Attacking|On K\.O\.|Activate)/.test(c.effectText))
        expect(base(c.id), c.id).toBe(true);
    }
  });
});
