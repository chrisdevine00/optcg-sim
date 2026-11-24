import type { CardScript } from '../../src/dsl.ts';

/** OP17-009 Haruta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_009: CardScript = {
  cardId: 'OP17-009',
  textHash: '0a4b46a223f3cc',
  verified: {
    source: 'cards/overrides/OP17-009.json (card text in cards/data)',
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
    {
      id: 'on-play',
      label: "K.O. up to 1 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 2000,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
