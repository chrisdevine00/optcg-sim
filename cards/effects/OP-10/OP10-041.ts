import type { CardScript } from '../../src/dsl.ts';

/** OP10-041 Radio Knife. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_041: CardScript = {
  cardId: 'OP10-041',
  textHash: '0dd4dd35d9538a',
  verified: {
    source: 'cards/overrides/OP10-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest up to 1 of your opponent's Characters with a cost of 6 or less; then K.O. up to 1 of your opponent's rested Characters with a cost of 5 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 6,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 5,
                    },
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
    'reading: "Then" is sequential, not "If you do": any rested Character with a cost of 5 or less may be K.O.\'d, not only the one just rested',
  ],
};
