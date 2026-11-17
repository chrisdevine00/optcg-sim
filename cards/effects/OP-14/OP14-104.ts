import type { CardScript } from '../../src/dsl.ts';

/** OP14-104 Gecko Moria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_104: CardScript = {
  cardId: 'OP14-104',
  textHash: '118c0438c22d7a',
  verified: {
    source: 'cards/overrides/OP14-104.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Play a {Thriller Bark Pirates} Character (cost 4 or less) from your trash, or add it to the top of your Life face-up',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            select: {
              from: 'trash',
              owner: 'you',
              filter: {
                all: [
                  {
                    category: ['Character'],
                  },
                  {
                    type: 'Thriller Bark Pirates',
                  },
                  {
                    cost: {
                      lte: 4,
                    },
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
              bind: 'target',
            },
          },
        },
        {
          if: {
            exists: {
              from: 'trash',
              owner: 'you',
              filter: {
                ref: 'target',
              },
            },
          },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      play: {
                        what: {
                          from: 'trash',
                          owner: 'you',
                          filter: {
                            ref: 'target',
                          },
                        },
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      move: {
                        what: {
                          from: 'trash',
                          owner: 'you',
                          filter: {
                            ref: 'target',
                          },
                        },
                        to: {
                          zone: 'life',
                          position: 'top',
                          faceUp: true,
                        },
                      },
                    },
                  },
                ],
              ],
              labels: ['Play it', 'Add it to the top of your Life cards face-up'],
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play up to 1 Character card with a cost of 4 or less from your trash',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
