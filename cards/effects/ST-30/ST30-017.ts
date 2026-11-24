import type { CardScript } from '../../src/dsl.ts';

/** ST30-017 And You Get Yourself in Big Trouble!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_017: CardScript = {
  cardId: 'ST30-017',
  textHash: '0288ca1d618a58',
  verified: {
    source: 'cards/overrides/ST30-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5; reveal up to 1 Character card with 6000 power to hand, the rest to the bottom',
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
                        power: {
                          eq: 6000,
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
