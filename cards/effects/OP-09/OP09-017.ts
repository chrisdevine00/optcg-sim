import type { CardScript } from '../../src/dsl.ts';

/** OP09-017 Wire. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_017: CardScript = {
  cardId: 'OP09-017',
  textHash: '1f6e9805170bbd',
  verified: {
    source: 'cards/overrides/OP09-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        '[DON!! x1] If your Leader has 7000 power or more and the {Kid Pirates} type, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
        {
          leader: {
            all: [
              {
                power: {
                  gte: 7000,
                },
              },
              {
                type: 'Kid Pirates',
              },
            ],
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
  ],
  rulings: ['reading: "7000 power" is the Leader\'s current power (given DON!! and buffs count)'],
};
