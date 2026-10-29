import type { CardScript } from '../../src/dsl.ts';

/** OP15-069 Nola. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_069: CardScript = {
  cardId: 'OP15-069',
  textHash: '0c3b4df6fc13ca',
  verified: {
    source: 'cards/overrides/OP15-069.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'shield',
      label: 'Return 1 DON!! card from your field instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            basePower: {
              lte: 7000,
            },
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
  ],
  rulings: ['QA-OP15 OP15-069: it can protect Nola itself'],
};
