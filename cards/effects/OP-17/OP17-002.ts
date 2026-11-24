import type { CardScript } from '../../src/dsl.ts';

/** OP17-002 Atmos. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_002: CardScript = {
  cardId: 'OP17-002',
  textHash: '0719cc19882d2e',
  verified: {
    source: 'cards/overrides/OP17-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn',
      label: "[Opponent's Turn] This Character gains +3000 power",
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
            amount: 3000,
          },
        },
      ],
    },
  ],
};
