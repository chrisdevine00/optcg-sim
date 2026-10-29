import type { CardScript } from '../../src/dsl.ts';

/** OP17-046 Gloriosa. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_046: CardScript = {
  cardId: 'OP17-046',
  textHash: '06a8e4e32b2248',
  verified: {
    source: 'cards/overrides/OP17-046.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Place up to 1 Character with a cost of 5 or less at the bottom of its owner's deck",
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
                    lte: 5,
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
};
