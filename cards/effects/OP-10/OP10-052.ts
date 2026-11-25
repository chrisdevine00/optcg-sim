import type { CardScript } from '../../src/dsl.ts';

/** OP10-052 Bartolomeo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_052: CardScript = {
  cardId: 'OP10-052',
  textHash: '1798401a2316fb',
  verified: {
    source: 'cards/overrides/OP10-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Place up to 1 Character with a cost of 1 or less at the bottom of the owner's deck",
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
                    lte: 1,
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
  rulings: ["reading: either player's Character, including your own; it goes to its owner's deck"],
};
