import type { CardScript } from '../../src/dsl.ts';

/** OP17-119 Loki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_119: CardScript = {
  cardId: 'OP17-119',
  textHash: '0acab0b586ee0c',
  verified: {
    source: 'cards/overrides/OP17-119.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'tall',
      label: 'This Character gains +12 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 12,
          },
        },
      ],
    },
    {
      id: 'opp-turn-power',
      label: "During your opponent's turn this Character gains +3000 power",
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
    {
      id: 'on-play',
      label: "K.O. your opponent's Characters with a total cost of 4 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 5,
                totalCost: {
                  lte: 4,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 OP17-089 via RL-43: the +12 cost applies only on the field',
    'reading: "total cost of 4 or less" is up to 5 Characters (the area limit) with a total cost of 4 or less; the printed text has no count',
  ],
};
