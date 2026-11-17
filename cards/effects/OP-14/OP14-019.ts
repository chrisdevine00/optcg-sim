import type { CardScript } from '../../src/dsl.ts';

/** OP14-019 I Have a Plan to Take Down One of the Four Emperors!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_019: CardScript = {
  cardId: 'OP14-019',
  textHash: '1717b294343adb',
  verified: {
    source: 'cards/overrides/OP14-019.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label: 'Look at 4; add up to 1 {Supernovas} or {Straw Hat Crew} Character to your hand',
      kind: 'activate',
      when: 'main',
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
                            type: 'Supernovas',
                          },
                          {
                            type: 'Straw Hat Crew',
                          },
                        ],
                      },
                      {
                        category: ['Character'],
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
};
