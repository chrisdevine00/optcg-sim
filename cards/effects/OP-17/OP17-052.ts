import type { CardScript } from '../../src/dsl.ts';

/** OP17-052 Don Marlon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_052: CardScript = {
  cardId: 'OP17-052',
  textHash: '007fe60877d367',
  verified: {
    source: 'cards/overrides/OP17-052.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 blue Event with a cost of 0 from your trash to your hand',
      kind: 'auto',
      when: ['onPlay'],
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
                      category: ['Event'],
                    },
                    {
                      color: 'Blue',
                    },
                    {
                      cost: {
                        eq: 0,
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
