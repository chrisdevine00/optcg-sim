import type { CardScript } from '../../src/dsl.ts';

/** ST23-001 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST23_001: CardScript = {
  cardId: 'ST23-001',
  textHash: '1e1c4cdce8c1ff',
  verified: {
    source: 'cards/overrides/ST23-001.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -4 cost while you have a Character with 10000 power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              power: {
                gte: 10000,
              },
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
            amount: -4,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "10000 power" is current power (given DON!! and buffs count), your Characters only, read each time the cost is needed',
  ],
};
