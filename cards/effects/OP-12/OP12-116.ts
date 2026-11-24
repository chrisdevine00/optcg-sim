import type { CardScript } from '../../src/dsl.ts';

/** OP12-116 We'll Ring the Bell Waiting for You!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_116: CardScript = {
  cardId: 'OP12-116',
  textHash: '0c89703d0547e4',
  verified: {
    source: 'cards/overrides/OP12-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5; reveal up to 2 Shandian Warrior Characters or [Mont Blanc Noland], add them, rest to the bottom',
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
                    upTo: 2,
                  },
                  filter: {
                    any: [
                      {
                        all: [
                          {
                            category: ['Character'],
                          },
                          {
                            type: 'Shandian Warrior',
                          },
                        ],
                      },
                      {
                        name: 'Mont Blanc Noland',
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
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a total of up to 2" is one pick of up to 2 cards in any mix of Shandian Warrior Characters and [Mont Blanc Noland]',
  ],
};
