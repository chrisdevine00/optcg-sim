import type { CardScript } from '../../src/dsl.ts';

/** OP09-079 Gum-Gum Jump Rope. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_079: CardScript = {
  cardId: 'OP09-079',
  textHash: '008f8c2f2edbe9',
  verified: {
    source: 'cards/overrides/OP09-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] DON!! -2: rest up to 1 of your opponent's Characters with a cost of 5 or less; then draw 1 card",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
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
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'trigger',
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, draw 1 card" is not "If you do": the draw happens even when no Character was rested (the cost is the only gate)',
  ],
};
