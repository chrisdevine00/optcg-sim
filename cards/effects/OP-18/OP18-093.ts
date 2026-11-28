import type { CardScript } from '../../src/dsl.ts';

/** OP18-093 Sleeptids. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_093: CardScript = {
  cardId: 'OP18-093',
  textHash: '1a09969fe9d89b',
  verified: {
    source: 'cards/overrides/OP18-093.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  rules: [{ anyNumberInDeck: true }],
  abilities: [],
};
