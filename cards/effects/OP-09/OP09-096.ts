import type { CardScript } from '../../src/dsl.ts';

/** OP09-096 My Era...Begins!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_096: CardScript = {
  cardId: 'OP09-096',
  textHash: '089e4a01115942',
  verified: {
    source: 'cards/overrides/OP09-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        '[Main] Look at 3; reveal up to 1 Blackbeard Pirates card other than [My Era...Begins!!] and add it to your hand; trash the rest',
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
                        type: 'Blackbeard Pirates',
                      },
                      {
                        not: {
                          name: 'My Era...Begins!!',
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
  rulings: [
    'reading: "trash the rest" trashes every looked-at card that was not taken, including when none was taken',
  ],
};
