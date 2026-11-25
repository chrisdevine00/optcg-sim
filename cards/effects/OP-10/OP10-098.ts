import type { CardScript } from '../../src/dsl.ts';

/** OP10-098 Liberation. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_098: CardScript = {
  cardId: 'OP10-098',
  textHash: '0eaa0086ed4129',
  verified: {
    source: 'cards/overrides/OP10-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If your Characters are at least 2 fewer than your opponent's, K.O. up to 1 of your opponent's Characters with a base cost of 6 or less and up to 1 with a base cost of 4 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            cmp: [
              {
                sum: [
                  {
                    count: {
                      from: 'characters',
                      owner: 'opponent',
                    },
                  },
                  {
                    mul: [
                      {
                        count: {
                          from: 'characters',
                          owner: 'you',
                        },
                      },
                      -1,
                    ],
                  },
                ],
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 6,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 4,
                    },
                  },
                  pick: {
                    upTo: 1,
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
      label:
        "Negate the effect of up to 1 of each of your opponent's Leader and Character cards during this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            negate: {
              target: {
                from: 'leader',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "at least 2 less" is opponent Characters minus yours >= 2, checked as the effect resolves; the two K.O.s are two separate "up to 1" picks, the cost-6 one first (the first K.O.d card is not eligible for the second); base cost, not current cost',
  ],
};
