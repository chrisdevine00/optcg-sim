import type { CardScript } from '../../src/dsl.ts';

/** EB04-046 Doll. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_046: CardScript = {
  cardId: 'EB04-046',
  textHash: '1c2958dd182405',
  verified: {
    source: 'cards/overrides/EB04-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cost-up',
      label: "Opponent's turn: all your {Navy} Characters gain +2 cost",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'Navy',
              },
            },
            amount: 2,
          },
        },
      ],
    },
  ],
};
