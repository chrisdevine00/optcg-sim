import type { CardScript } from '../../src/dsl.ts';

/** OP11-036 Spotted Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_036: CardScript = {
  cardId: 'OP11-036',
  textHash: '10786493496377',
  verified: {
    source: 'cards/overrides/OP11-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Shirahoshi], look at 5; reveal up to 1 {Neptunian} card or [Shirahoshi] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    any: [
                      {
                        type: 'Neptunian',
                      },
                      {
                        name: 'Shirahoshi',
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader condition is the exact name [Shirahoshi]; the search is ungated by the hidden deck',
  ],
};
