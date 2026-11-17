import type { CardScript } from '../../src/dsl.ts';

/** OP17-023 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_023: CardScript = {
  cardId: 'OP17-023',
  textHash: '077f490ab9106b',
  verified: {
    source: 'cards/overrides/OP17-023.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rest-shield',
      label: 'Rest this Character instead of a K.O.',
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            any: [
              {
                type: 'East Blue',
              },
              {
                type: 'Straw Hat Crew',
              },
            ],
          },
        },
      },
      optional: true,
      instead: [
        {
          restSelf: true,
        },
      ],
    },
  ],
  rulings: [
    "QA-OP17 OP17-023 (rulings.md, one application can cover several simultaneous events): one rest saves two Characters K.O.'d at once; Nami may save herself while active",
  ],
};
