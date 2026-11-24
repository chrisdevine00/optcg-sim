import type { CardScript } from '../../src/dsl.ts';

/** EB03-022. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_022: CardScript = {
  cardId: 'EB03-022',
  textHash: '18db4f0c4acda0',
  verified: {
    source: 'cards/overrides/EB03-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Place up to 1 Character with a cost of 4 or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 4,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a Character" is any Character on either side, current cost (so a cost reduction counts; Isuka herself costs 6 and is not eligible)',
  ],
};
