import type { CardScript } from '../../src/dsl.ts';

/** OP15-092 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_092: CardScript = {
  cardId: 'OP15-092',
  textHash: '0944bd102ea9f9',
  verified: {
    source: 'cards/overrides/OP15-092.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'trash-tiers',
      label: 'Effects by the number of cards in your trash (10, 20, 30)',
      kind: 'permanent',
      apply: [
        {
          tiers: [
            {
              when: {
                cmp: [
                  {
                    trash: 'you',
                  },
                  '>=',
                  10,
                ],
              },
              apply: [
                {
                  setBasePower: {
                    target: {
                      from: 'self',
                      owner: 'you',
                    },
                    value: 9000,
                  },
                },
                {
                  cost: {
                    target: {
                      from: 'self',
                      owner: 'you',
                    },
                    amount: 10,
                  },
                },
              ],
            },
            {
              when: {
                all: [
                  {
                    cmp: [
                      {
                        trash: 'you',
                      },
                      '>=',
                      20,
                    ],
                  },
                  {
                    opponentsTurn: true,
                  },
                ],
              },
              apply: [
                {
                  setBasePower: {
                    target: {
                      from: 'leader',
                      owner: 'you',
                    },
                    value: 7000,
                  },
                },
              ],
            },
            {
              when: {
                cmp: [
                  {
                    trash: 'you',
                  },
                  '>=',
                  30,
                ],
              },
              apply: [
                {
                  power: {
                    target: {
                      from: 'self',
                      owner: 'you',
                    },
                    amount: 1000,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the tiers are cumulative ("Apply each of the following effects"): at 30 cards all three apply',
    'RL-33: several base-power effects, the highest applies (CR 4-9-2-1)',
  ],
};
