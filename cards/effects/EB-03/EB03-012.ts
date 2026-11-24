import type { CardScript } from '../../src/dsl.ts';

/** EB03-012. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_012: CardScript = {
  cardId: 'EB03-012',
  textHash: '153734bbb918e1',
  verified: {
    source: 'cards/overrides/EB03-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rest',
      label:
        "You may rest this Character: rest up to 1 of your opponent's DON!! cards or {Animal} or {SMILE} Characters with a cost of 3 or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: ['characters', 'donCostArea'],
              owner: 'opponent',
              filter: {
                all: [
                  {
                    any: [
                      {
                        type: 'Animal',
                      },
                      {
                        type: 'SMILE',
                      },
                    ],
                  },
                  {
                    cost: {
                      lte: 3,
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
  ],
  rulings: [
    'reading: "cost of 3 or less" qualifies the Characters only (the filter is not applied to DON!!); only active DON!! can be rested; the cost is paid first (this Character is rested)',
  ],
};
