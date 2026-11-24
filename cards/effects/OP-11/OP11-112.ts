import type { CardScript } from '../../src/dsl.ts';

/** OP11-112 Megalo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_112: CardScript = {
  cardId: 'OP11-112',
  textHash: '0f2459d8fb07ef',
  verified: {
    source: 'cards/overrides/OP11-112.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'boost',
      label: "[Opponent's Turn] If your Leader is [Shirahoshi], this Character gains +4000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          leader: {
            name: 'Shirahoshi',
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
            amount: 4000,
          },
        },
      ],
    },
  ],
};
