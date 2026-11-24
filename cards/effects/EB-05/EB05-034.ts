import type { CardScript } from '../../src/dsl.ts';

/** EB05-034 Sugar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_034: CardScript = {
  cardId: 'EB05-034',
  textHash: '18acfdb5c9be9e',
  verified: {
    source: 'cards/overrides/EB05-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -2: with 7+ DON!! on your field, give up to 1 opposing Character -4000 power',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              7,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -4000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading: the "7 or more DON!!" condition is checked after the DON!! -2 cost is paid (the cost precedes the colon, the "if" is part of the effect)',
  ],
};
