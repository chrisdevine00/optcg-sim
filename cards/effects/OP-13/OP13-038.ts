import type { CardScript } from '../../src/dsl.ts';

/** OP13-038 Gum-Gum Elephant Gun. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_038: CardScript = {
  cardId: 'OP13-038',
  textHash: '1e3b12162199f3',
  verified: {
    source: 'cards/overrides/OP13-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest up to 1 of the opponent's Characters with a cost of 5 or less; then set up to 2 of your DON!! cards as active at the end of this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 5 } },
              pick: { upTo: 1 },
            },
          },
        },
        {
          delayed: { at: 'endOfThisTurn' },
          do: [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 2 } } } }],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of the opponent's Characters with a cost of 5 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 5 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
