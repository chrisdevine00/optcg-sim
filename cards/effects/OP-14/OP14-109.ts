import type { CardScript } from '../../src/dsl.ts';

/** OP14-109 Victoria Cindry. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_109: CardScript = {
  cardId: 'OP14-109',
  textHash: '08125e4cf98a3e',
  verified: {
    source: 'cards/overrides/OP14-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
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
