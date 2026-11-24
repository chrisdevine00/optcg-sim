import type { CardScript } from '../../src/dsl.ts';

/** OP13-017 Monkey.D.Dragon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_017: CardScript = {
  cardId: 'OP13-017',
  textHash: '00b818770d8fdd',
  verified: {
    source: 'cards/overrides/OP13-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: instead of your Revolutionary Army Character being removed by the opponent's effect, this Character gets -2000 power",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Revolutionary Army',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
