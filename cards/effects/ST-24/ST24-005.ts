import type { CardScript } from '../../src/dsl.ts';

/** ST24-005 X.Drake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST24_005: CardScript = {
  cardId: 'ST24-005',
  textHash: '0102f669a6e733',
  verified: {
    source: 'cards/overrides/ST24-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {Supernovas} type, rest up to 1 of your opponent's Characters with a cost of 5 or less; then set up to 1 of your DON!! cards as active at the end of this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Supernovas' } },
          then: [
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
              do: [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } }],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then" after a failed "If" does not resolve, so the end-of-turn DON!! is inside the guard: with a Leader that is not {Supernovas} nothing is set active; with it, the DON!! is set active even if no Character was rested',
    'reading: "cost of 5 or less" is the current cost; the DON!! to set active is chosen at the end of the turn',
  ],
};
