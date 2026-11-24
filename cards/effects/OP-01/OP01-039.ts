import type { CardScript } from '../../src/dsl.ts';

/** OP01-039 Killer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP01_039: CardScript = {
  cardId: 'OP01-039',
  textHash: '1b383740639199',
  verified: {
    source: 'cards/overrides/OP01-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-block',
      label: '[DON!! x1] If you have 3 or more Characters, draw 1 card',
      kind: 'auto',
      when: ['onBlock'],
      conditions: [
        { donGiven: 1 },
        { cmp: [{ count: { from: 'characters', owner: 'you' } }, '>=', 3] },
      ],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading: Killer counts himself among the 3 Characters; the count is checked at the trigger and as it resolves',
  ],
};
