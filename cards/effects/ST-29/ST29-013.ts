import type { CardScript } from '../../src/dsl.ts';

/** ST29-013 Rob Lucci. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_013: CardScript = {
  cardId: 'ST29-013',
  textHash: '19d77c12bd5cc2',
  verified: {
    source: 'cards/overrides/ST29-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        "K.O. up to 1 of your opponent's Characters with a cost equal to or less than the total of your and your opponent's Life cards",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: { life: 'both' } } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
