import type { CardScript } from '../../src/dsl.ts';

/** OP07-064 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP07_064: CardScript = {
  cardId: 'OP07-064',
  textHash: '07fc14a287619b',
  verified: {
    source: 'cards/overrides/OP07-064.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cheaper',
      label: "In hand: -3 cost while your DON!! on field is at least 2 less than your opponent's",
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '<=',
            {
              sum: [
                {
                  donOnField: 'opponent',
                },
                -2,
              ],
            },
          ],
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -3,
          },
        },
      ],
    },
  ],
};
