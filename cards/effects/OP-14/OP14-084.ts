import type { CardScript } from '../../src/dsl.ts';

/** OP14-084 Ms. All Sunday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_084: CardScript = {
  cardId: 'OP14-084',
  textHash: '09f2e76cd239d9',
  verified: {
    source: 'cards/overrides/OP14-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader\'s type includes "Baroque Works", play up to 1 Baroque Works Character with a cost of 4 or less and up to 1 with a cost of 1 from your trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Baroque Works',
            },
          },
          then: [
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
                          typeIncludes: 'Baroque Works',
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
                          typeIncludes: 'Baroque Works',
                        },
                        {
                          cost: {
                            eq: 1,
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
    },
  ],
  rulings: [
    'reading (M6b-Q6): "and up to 1" is two separate picks, the cost-4-or-less one first, then the cost-1 one (a cost-1 card may fill either, never both); costs are the cards\' printed costs in the trash',
  ],
};
