import type { CardScript } from '../../src/dsl.ts';

/** OP18-007 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_007: CardScript = {
  cardId: 'OP18-007',
  textHash: '0e4a982ccbf365',
  verified: {
    source: 'cards/overrides/OP18-007.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'navy',
      label: 'If your Leader has the {Navy} type, gains [Banish] and +1000 power',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Navy',
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
            keyword: 'Banish',
          },
        },
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
};
