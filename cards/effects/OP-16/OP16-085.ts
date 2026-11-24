import type { CardScript } from '../../src/dsl.ts';

/** OP16-085 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_085: CardScript = {
  cardId: 'OP16-085',
  textHash: '03caff3d1f5c64',
  verified: {
    source: 'cards/overrides/OP16-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Land of Wano} Character with a cost of 6 or less other than [Kouzuki Momonosuke] from your trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Land of Wano',
                    },
                    {
                      cost: {
                        lte: 6,
                      },
                    },
                    {
                      not: {
                        name: 'Kouzuki Momonosuke',
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
        },
      ],
    },
  ],
};
