import type { CardScript } from '../../src/dsl.ts';

/** OP12-077 The "Extinguishes All Sound Created by Your Influence" Technique. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_077: CardScript = {
  cardId: 'OP12-077',
  textHash: '0eea6f17f6cf05',
  verified: {
    source: 'cards/overrides/OP12-077.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Select up to 1 of your [Trafalgar Law] cards: it gains +2000 power during this turn, and your opponent cannot activate [Blocker] when it attacks during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            select: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: { name: 'Trafalgar Law' },
              pick: { upTo: 1 },
              bind: 'law',
            },
          },
        },
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', filter: { ref: 'law' } },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            restrict: {
              target: { from: ['leader', 'characters'], owner: 'you', filter: { ref: 'law' } },
              what: 'cannotActivateBlockerAgainstIt',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'Reading: [Trafalgar Law] cards are your Leader and Characters of that name; the Blocker lock follows the selected card for the turn (cannotActivateBlockerAgainstIt), so it applies to every attack it makes this turn',
  ],
};
