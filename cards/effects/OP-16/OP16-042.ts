import type { CardScript } from '../../src/dsl.ts';

/** OP16-042 Prisoner of Impel Down. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_042: CardScript = {
  cardId: 'OP16-042',
  textHash: '01ce9e409f8275',
  verified: {
    source: 'cards/overrides/OP16-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  rules: [
    {
      anyNumberInDeck: true,
    },
  ],
  abilities: [],
};
