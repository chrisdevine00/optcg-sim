import type { CardScript } from '../../src/dsl.ts';

/** OP11-085 Kurozumi Orochi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_085: CardScript = {
  cardId: 'OP11-085',
  textHash: '0414f07db1d9d0',
  verified: {
    source: 'cards/overrides/OP11-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Add up to 1 "SMILE" card with a cost of 5 or less from your trash to your hand',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'SMILE',
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
};
