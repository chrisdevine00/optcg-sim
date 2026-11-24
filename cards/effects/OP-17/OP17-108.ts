import type { CardScript } from '../../src/dsl.ts';

/** OP17-108 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_108: CardScript = {
  cardId: 'OP17-108',
  textHash: '044311e6f915da',
  verified: {
    source: 'cards/overrides/OP17-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 6 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
