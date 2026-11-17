import type { CardScript } from '../../src/dsl.ts';

/** OP16-064 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_064: CardScript = {
  cardId: 'OP16-064',
  textHash: '1b46d7fdae02b7',
  verified: {
    source: 'cards/overrides/OP16-064.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Navy} card other than [Koby] to your hand; the rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
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
                    all: [
                      {
                        type: 'Navy',
                      },
                      {
                        not: {
                          name: 'Koby',
                        },
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
};
