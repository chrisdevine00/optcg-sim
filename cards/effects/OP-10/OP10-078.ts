import type { CardScript } from '../../src/dsl.ts';

/** OP10-078 I Do Not Forgive Those Who Laugh at My Family!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_078: CardScript = {
  cardId: 'OP10-078',
  textHash: '16054cdc48cbe4',
  verified: {
    source: 'cards/overrides/OP10-078.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3 cards from the top of your deck; reveal up to 1 {Donquixote Pirates} card other than this one and add it to your hand, then place the rest at the bottom of your deck in any order',
      kind: 'activate',
      when: ['main', 'counter'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Donquixote Pirates',
                      },
                      {
                        not: {
                          name: 'I Do Not Forgive Those Who Laugh at My Family!!!',
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
