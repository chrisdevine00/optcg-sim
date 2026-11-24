import type { CardScript } from '../../src/dsl.ts';

/** EB05-027 Hibari. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_027: CardScript = {
  cardId: 'EB05-027',
  textHash: '0edd83dc46c26c',
  verified: {
    source: 'cards/overrides/EB05-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Draw 3, trash 2; place up to 1 Character cost 2 or less at the bottom of its owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 3,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 2,
              },
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 2,
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
