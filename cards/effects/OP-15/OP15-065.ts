import type { CardScript } from '../../src/dsl.ts';

/** OP15-065 Goro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_065: CardScript = {
  cardId: 'OP15-065',
  textHash: '16bdac0243b963',
  verified: {
    source: 'cards/overrides/OP15-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal the top card; if it has a cost of 2 or less, add up to 1 DON!! from your DON!! deck and rest it',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            reveal: {
              from: 'deckTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              cost: {
                lte: 2,
              },
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
