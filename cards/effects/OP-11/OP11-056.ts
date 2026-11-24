import type { CardScript } from '../../src/dsl.ts';

/** OP11-056 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_056: CardScript = {
  cardId: 'OP11-056',
  textHash: '1c07de599ab870',
  verified: {
    source: 'cards/overrides/OP11-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Place up to 1 Character with a base cost of 1 at the bottom of the owner's deck",
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
                  baseCost: {
                    eq: 1,
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
