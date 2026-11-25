import type { CardScript } from '../../src/dsl.ts';

/** OP10-058 Rebecca. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_058: CardScript = {
  cardId: 'OP10-058',
  textHash: '06938e28b5b1c6',
  verified: {
    source: 'cards/overrides/OP10-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If there is a Character with a cost of 8 or more, draw 1 card; then reveal up to 2 {Dressrosa} Characters with cost 7 or less other than [Rebecca] from your hand, play 1 and play the other rested if it has a cost of 4 or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 8,
                },
              },
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                select: {
                  from: 'hand',
                  owner: 'you',
                  filter: {
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        type: 'Dressrosa',
                      },
                      {
                        cost: {
                          lte: 7,
                        },
                      },
                      {
                        not: {
                          name: 'Rebecca',
                        },
                      },
                    ],
                  },
                  pick: {
                    upTo: 2,
                  },
                  bind: 'revealed',
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      ref: 'revealed',
                    },
                    pick: {
                      exactly: 1,
                    },
                    bind: 'played',
                  },
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          ref: 'revealed',
                        },
                        {
                          not: {
                            ref: 'played',
                          },
                        },
                        {
                          cost: {
                            lte: 4,
                          },
                        },
                      ],
                    },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the reveal-and-play half is inside the cost-8 guard ("Then" after a failed "If" does not resolve, M4b-5); the Character that is not played stays in hand when its cost is 5 or more; with two revealed cards of cost 4 or less the player picks which one is played active and the other is played rested',
    'reading: the reveal has no engine event of its own (cosmetic); the cost-8 check counts a Character of either player (Rebecca herself is cost 7)',
  ],
};
