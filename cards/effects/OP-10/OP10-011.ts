import type { CardScript } from '../../src/dsl.ts';

/** OP10-011 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_011: CardScript = {
  cardId: 'OP10-011',
  textHash: '084b53f27222ed',
  verified: {
    source: 'cards/overrides/OP10-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-turn',
      label: "Opponent's Turn: +2000 power",
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
            amount: 2000,
          },
        },
      ],
    },
  ],
};
