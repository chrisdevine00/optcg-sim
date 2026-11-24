import type { CardScript } from '../../src/dsl.ts';

/** OP14-102 Kumacy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_102: CardScript = {
  cardId: 'OP14-102',
  textHash: '1223ea44538681',
  verified: {
    source: 'cards/overrides/OP14-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Thriller Bark Pirates' },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};
