import type { CardScript } from '../../src/dsl.ts';

/** OP10-035 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_035: CardScript = {
  cardId: 'OP10-035',
  textHash: '0fdbf000bca9d7',
  verified: {
    source: 'cards/overrides/OP10-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "Rest up to 1 of your opponent's Leader or Character cards with a cost of 5 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters'],
              owner: 'opponent',
              filter: {
                any: [
                  {
                    category: ['Leader'],
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
  ],
  rulings: [
    'reading (M6b-Q48): a Leader has no cost, so the cost limit restricts the Characters only and the opposing Leader is always eligible',
  ],
};
