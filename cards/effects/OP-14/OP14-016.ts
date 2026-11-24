import type { CardScript } from '../../src/dsl.ts';

/** OP14-016 X.Drake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_016: CardScript = {
  cardId: 'OP14-016',
  textHash: '088a9ce7e07147',
  verified: {
    source: 'cards/overrides/OP14-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Opponent's turn: instead of a {Supernovas} Character being removed by the opponent's effect, give your Leader -2000 power",
      kind: 'replacement',
      oncePerTurn: true,
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Supernovas',
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
                from: 'leader',
                owner: 'you',
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "[DON!! x1] Give up to 1 of your opponent's Characters -2000 power",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q3 sign): the card text prints -2000 for the Leader; scripted as printed, a Leader power loss that may go to 0 or below. Once Per Turn counts when the replacement is used',
    "reading: X.Drake covers himself (he is {Supernovas}) and any removal by the opponent's effect (K.O., bounce, trash), on the opponent's turn only",
  ],
};
