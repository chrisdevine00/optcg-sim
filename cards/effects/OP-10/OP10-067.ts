import type { CardScript } from '../../src/dsl.ts';

/** OP10-067 Senor Pink. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_067: CardScript = {
  cardId: 'OP10-067',
  textHash: '08c107bb262cb9',
  verified: {
    source: 'cards/overrides/OP10-067.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: add a purple Event with a cost of 5 or less from your trash to your hand; set up to 1 DON!! active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
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
                      color: 'Purple',
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
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['"Then, set up" runs even if no Event was added (CR 4-10-2): no "if" precedes it'],
};
