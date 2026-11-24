import type { CardScript } from '../../src/dsl.ts';

/** OP15-082 Charlotte Lola. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_082: CardScript = {
  cardId: 'OP15-082',
  textHash: '091f5040abc02e',
  verified: {
    source: 'cards/overrides/OP15-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            mill: {
              player: 'you',
              n: 3,
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Add up to 1 Character card with a cost of 8 or less from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
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
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 8,
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
