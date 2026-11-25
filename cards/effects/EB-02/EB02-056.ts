import type { CardScript } from '../../src/dsl.ts';

/** EB02-056 Vegapunk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_056: CardScript = {
  cardId: 'EB02-056',
  textHash: '1babb6028bbcba',
  verified: {
    source: 'cards/overrides/EB02-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; play up to 1 {Scientist} Character with a cost of 5 or less other than [Vegapunk]; the rest to the bottom in any order; if your opponent has 2 or less Characters, trash 1 card from your hand',
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
                        category: ['Character'],
                      },
                      {
                        type: 'Scientist',
                      },
                      {
                        cost: {
                          lte: 5,
                        },
                      },
                      {
                        not: {
                          name: 'Vegapunk',
                        },
                      },
                    ],
                  },
                  to: 'play',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'opponent',
                },
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "and if your opponent has 2 or less Characters" is an independent effect-level condition, read after the look resolves (an empty opposing board counts); it does not depend on a card having been played; the hand trash is mandatory',
  ],
};
