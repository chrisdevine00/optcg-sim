import type { CardScript } from '../../src/dsl.ts';

/** EB05-012 Camie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_012: CardScript = {
  cardId: 'EB05-012',
  textHash: '0be08d6b743cc5',
  verified: {
    source: 'cards/overrides/EB05-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
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
      ],
    },
  ],
};
