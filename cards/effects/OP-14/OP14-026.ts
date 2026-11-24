import type { CardScript } from '../../src/dsl.ts';

/** OP14-026 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_026: CardScript = {
  cardId: 'OP14-026',
  textHash: '1cb898a00910e2',
  verified: {
    source: 'cards/overrides/OP14-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested-boost',
      label: "Opponent's turn, if rested: +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          self: {
            state: 'rested',
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
            amount: 2000,
          },
        },
      ],
    },
  ],
};
