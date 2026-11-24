import type { CardScript } from '../../src/dsl.ts';

/** OP16-017 LittleOars Jr.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_017: CardScript = {
  cardId: 'OP16-017',
  textHash: '19daf7d6a31f00',
  verified: {
    source: 'cards/overrides/OP16-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'weak',
      label:
        'If you have no Whitebeard Pirates Characters with a cost of 8 or more, this Character gets -4000 power',
      kind: 'permanent',
      conditions: [
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  typeIncludes: 'Whitebeard Pirates',
                },
                {
                  cost: {
                    gte: 8,
                  },
                },
              ],
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -4000,
          },
        },
      ],
    },
  ],
};
