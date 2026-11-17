import type { CardScript } from '../../src/dsl.ts';

/** EB04-059 Black Rope Dragon Twister. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_059: CardScript = {
  cardId: 'EB04-059',
  textHash: '1fd2c105f8e3fb',
  verified: {
    source: 'cards/overrides/EB04-059.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Turn 1 Life card face-up: with fewer Characters than your opponent, K.O. two of theirs',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          turnLifeFaceUp: 1,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                },
              },
              '<',
              {
                count: {
                  from: 'characters',
                  owner: 'opponent',
                },
              },
            ],
          },
          then: [
            {
              do: {
                select: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 6,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                  bind: 'a',
                },
              },
            },
            {
              do: {
                select: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    all: [
                      {
                        cost: {
                          lte: 5,
                        },
                      },
                      {
                        not: {
                          ref: 'a',
                        },
                      },
                    ],
                  },
                  pick: {
                    upTo: 1,
                  },
                  bind: 'b',
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    ref: 'a',
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
                    ref: 'b',
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
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
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
};
