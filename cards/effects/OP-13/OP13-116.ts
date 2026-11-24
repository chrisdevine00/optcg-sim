import type { CardScript } from '../../src/dsl.ts';

/** OP13-116 The One Who Is the Most Free Is the Pirate King!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_116: CardScript = {
  cardId: 'OP13-116',
  textHash: '041aedfacbae53',
  verified: {
    source: 'cards/overrides/OP13-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5, reveal up to 1 {Supernovas} Character to hand, rest to bottom in any order',
      kind: 'activate',
      when: 'main',
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
                        category: ['Character'],
                      },
                      {
                        type: 'Supernovas',
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
