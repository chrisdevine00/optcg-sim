import type { CardScript } from '../../src/dsl.ts';

/** EB02-005 Fake Straw Hat Crew. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_005: CardScript = {
  cardId: 'EB02-005',
  textHash: '15d3107647d015',
  verified: {
    source: 'cards/overrides/EB02-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'your-turn-power',
      label: '[Your Turn] +2000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'opp-turn-power',
      label: "[Opponent's Turn] -2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -2000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (block 3 audit Q2, settled by the verified text): the second clause is "Give this Character -2000 power": -2000 on the opponent\'s turn, +2000 on yours',
  ],
};
