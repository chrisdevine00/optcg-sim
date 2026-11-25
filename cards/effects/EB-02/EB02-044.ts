import type { CardScript } from '../../src/dsl.ts';

/** EB02-044 Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_044: CardScript = {
  cardId: 'EB02-044',
  textHash: '08115f4c0e2a37',
  verified: {
    source: 'cards/overrides/EB02-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 black {Navy} Character with a cost of 4 or less from your trash rested',
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
                      color: 'Black',
                    },
                    {
                      type: 'Navy',
                    },
                    {
                      cost: {
                        lte: 4,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: a multicolor card that includes black counts as black; the Character enters rested',
  ],
};
