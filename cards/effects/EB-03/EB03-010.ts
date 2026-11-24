import type { CardScript } from '../../src/dsl.ts';

/** EB03-010. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_010: CardScript = {
  cardId: 'EB03-010',
  textHash: '1adbeeececcf7a',
  verified: {
    source: 'cards/overrides/EB03-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 Character with 1000 power or less or up to 1 Event and add it to your hand; the rest to the bottom in any order',
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
                    any: [
                      {
                        all: [
                          {
                            category: ['Character'],
                          },
                          {
                            power: {
                              lte: 1000,
                            },
                          },
                        ],
                      },
                      {
                        category: ['Event'],
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
    'reading: "up to 1 Character with 1000 power or less or up to 1 Event" is one pick of up to 1 card (not one of each); a 0-power Character qualifies; Events have no power so only Characters are power-tested',
  ],
};
