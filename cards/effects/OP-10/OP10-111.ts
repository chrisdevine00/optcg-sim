import type { CardScript } from '../../src/dsl.ts';

/** OP10-111 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_111: CardScript = {
  cardId: 'OP10-111',
  textHash: '0e99cb8d301da1',
  verified: {
    source: 'cards/overrides/OP10-111.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 Supernovas card other than [Monkey.D.Luffy] and add it to your hand; place the rest at the bottom in any order',
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
                        type: 'Supernovas',
                      },
                      {
                        not: {
                          name: 'Monkey.D.Luffy',
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
