/**
 * M6b wave 2, G12: the validator half. `anyNumberInDeck` and `deckRestriction` are accepted as
 * `rules` clauses (their effect on a deck is tested in test/rules/deck-format.test.ts, through
 * `deckIssues`), and a restriction that reads more than printed card values is refused.
 */
import { describe, expect, it } from 'vitest';
import { validateScript, type CardScript } from '@optcg/cards';
import { cardMatchesDeckFilter } from '../../../src/deck.ts';
import { cards } from '../../fixtures/index.ts';

const script = (rules: unknown[]): CardScript =>
  ({
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-23' },
    rules,
    abilities: [],
  }) as unknown as CardScript;

describe('G12 rules clauses validate', () => {
  it('accepts anyNumberInDeck and a deckRestriction of printed values', () => {
    expect(validateScript(script([{ anyNumberInDeck: true }]))).toEqual([]);
    expect(validateScript(script([{ deckRestriction: { cost: { gte: 5 } } }]))).toEqual([]);
    expect(
      validateScript(
        script([
          {
            deckRestriction: {
              all: [{ color: 'Red' }, { not: { type: 'Navy' } }, { nameIncludes: 'Ace' }],
            },
          },
        ]),
      ),
    ).toEqual([]);
  });

  it('refuses a restriction that is not about printed values, and bad shapes', () => {
    const bad = (r: unknown) => validateScript(script([r]));
    expect(bad({ anyNumberInDeck: false })).not.toEqual([]);
    expect(bad({ deckRestriction: { state: 'rested' } })).not.toEqual([]);
    expect(bad({ deckRestriction: { isSelf: true } })).not.toEqual([]);
    expect(bad({ deckRestriction: { all: [{ ref: 'x' }] } })).not.toEqual([]);
    expect(
      bad({ deckRestriction: { cost: { gte: { count: { from: 'hand', owner: 'you' } } } } }),
    ).not.toEqual([]);
    expect(bad({ deckRestriction: 'cost' })).not.toEqual([]);
  });
});

describe('the deck filter reads printed card values', () => {
  const card = (id: string) => cards()(id)!;
  it('cost, name, type, colour, attribute, category and combinations', () => {
    const blugori = card('OP02-084'); // Blugori, cost 1, {Animal}{Impel Down}, Slash
    const urashima = card('OP01-092'); // cost 7
    expect(cardMatchesDeckFilter(urashima, { cost: { gte: 5 } })).toBe(true);
    expect(cardMatchesDeckFilter(blugori, { cost: { gte: 5 } })).toBe(false);
    expect(cardMatchesDeckFilter(blugori, { nameIncludes: 'lug' })).toBe(true);
    expect(cardMatchesDeckFilter(blugori, { type: 'Impel Down' })).toBe(true);
    expect(cardMatchesDeckFilter(blugori, { attribute: 'Slash' })).toBe(true);
    expect(cardMatchesDeckFilter(blugori, { category: ['Event'] })).toBe(false);
    expect(
      cardMatchesDeckFilter(blugori, { all: [{ color: 'Purple' }, { not: { cost: { lte: 0 } } }] }),
    ).toBe(true);
    expect(cardMatchesDeckFilter(blugori, { any: [{ name: 'X' }, { power: { eq: 3000 } }] })).toBe(
      true,
    );
  });
});
