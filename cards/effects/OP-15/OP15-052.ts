import type { CardScript } from '../../src/dsl.ts';

/** OP15-052 Leo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_052: CardScript = {
  cardId: 'OP15-052',
  textHash: '0b74eb0de5f34b',
  verified: {
    source: 'cards/overrides/OP15-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your Character with 7000 base power or less would be removed by your opponent's effect, you may place 1 of your Characters at the bottom of its owner's deck instead",
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
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
    },
  ],
};
