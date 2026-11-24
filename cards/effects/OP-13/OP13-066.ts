import type { CardScript } from '../../src/dsl.ts';

/** OP13-066 Silvers Rayleigh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_066: CardScript = {
  cardId: 'OP13-066',
  textHash: '121a0cb693538d',
  verified: {
    source: 'cards/overrides/OP13-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'on-play',
      label:
        'With any DON!! given: rest up to 1 opposing Character with a cost of 5 or less, then add up to 1 DON!! active at the end of this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donGiven: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 5,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
            {
              delayed: {
                at: 'endOfThisTurn',
              },
              do: [
                {
                  do: {
                    addDon: [
                      {
                        n: 1,
                        state: 'active',
                        upTo: true,
                      },
                    ],
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
    'reading: "Then" is inside the "If" (nothing happens with no DON!! given); the DON!! add is delayed to the end of this turn as a whole (the count is asked then and it enters active), not added rested now and set active later',
  ],
};
