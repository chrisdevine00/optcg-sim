import type { CardScript } from '../../src/dsl.ts';

/** OP16-005 Thatch. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_005: CardScript = {
  cardId: 'OP16-005',
  textHash: '02b69c16644866',
  verified: {
    source: 'cards/overrides/OP16-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -3 cost if you have a Whitebeard Pirates Character with 8000 power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  power: {
                    gte: 8000,
                  },
                },
                {
                  typeIncludes: 'Whitebeard Pirates',
                },
              ],
            },
          },
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
