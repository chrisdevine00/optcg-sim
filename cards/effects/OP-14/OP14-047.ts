import type { CardScript } from '../../src/dsl.ts';

/** OP14-047 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_047: CardScript = {
  cardId: 'OP14-047',
  textHash: '13e175098c5bed',
  verified: {
    source: 'cards/overrides/OP14-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 1 card and play up to 1 {Fish-Man} or {Merfolk} type Character card with a cost of 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      any: [
                        {
                          type: 'Fish-Man',
                        },
                        {
                          type: 'Merfolk',
                        },
                      ],
                    },
                    {
                      cost: {
                        lte: 3,
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
