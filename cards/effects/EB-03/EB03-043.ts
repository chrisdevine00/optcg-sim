import type { CardScript } from '../../src/dsl.ts';

/** EB03-043 Stussy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_043: CardScript = {
  cardId: 'EB03-043',
  textHash: '0bd1d4a44cd321',
  verified: {
    source: 'cards/overrides/EB03-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "Place 2 {CP} cards from your trash at the bottom of your deck in any order: K.O. up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            filter: { typeIncludes: 'CP' },
            pick: { exactly: 2 },
          },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
