import type { CardScript } from '../../src/dsl.ts';

/** OP09-056 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_056: CardScript = {
  cardId: 'OP09-056',
  textHash: '0236bf8d833e36',
  verified: {
    source: 'cards/overrides/OP09-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 {Cross Guild} card or card with a type including "Baroque Works" other than [Mr.3(Galdino)] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        any: [
                          {
                            type: 'Cross Guild',
                          },
                          {
                            typeIncludes: 'Baroque Works',
                          },
                        ],
                      },
                      {
                        not: {
                          name: 'Mr.3(Galdino)',
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
  rulings: [
    'reading: any category (Characters, Events, Stages); the exclusion is by exact name [Mr.3(Galdino)]',
  ],
};
