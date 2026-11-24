import type { CardScript } from '../../src/dsl.ts';

/** ST31-003 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST31_003: CardScript = {
  cardId: 'ST31-003',
  textHash: '152d3322e7aa0c',
  verified: {
    source: 'cards/overrides/ST31-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'guard',
      label:
        "Opponent's Turn: with 3 or more given DON!! in total, this Character gains [Blocker] and +3000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          cmp: [
            {
              donGiven: 'you',
            },
            '>=',
            3,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a total of 3 or more given DON!! cards" counts every DON!! given to any of your Leader and Characters, not only to this card',
  ],
};
