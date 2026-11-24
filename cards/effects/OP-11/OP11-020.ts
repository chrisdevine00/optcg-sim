import type { CardScript } from '../../src/dsl.ts';

/** OP11-020 X Calibur. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_020: CardScript = {
  cardId: 'OP11-020',
  textHash: '13d7dbf98e19b4',
  verified: {
    source: 'cards/overrides/OP11-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Give up to 2 of your opponent's Characters -2000 power this turn; then up to 1 of your {Navy} Characters gains +1000 power this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 2,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Navy',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 4000,
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
  rulings: [
    'reading: "Then" is sequential: the {Navy} boost does not depend on the first step; the Navy Character is chosen when the second step resolves',
  ],
};
