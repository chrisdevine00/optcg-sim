import type { CardScript } from '../../src/dsl.ts';

/** OP11-099 I'm Gonna Be a Navy Officer!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_099: CardScript = {
  cardId: 'OP11-099',
  textHash: '16cb51e07ada49',
  verified: {
    source: 'cards/overrides/OP11-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3, reveal up to 1 "Navy" card other than this one and add it to your hand, trash the rest',
      kind: 'activate',
      when: 'main',
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
                        type: 'Navy',
                      },
                      {
                        not: {
                          name: "I'm Gonna Be a Navy Officer!!!",
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
