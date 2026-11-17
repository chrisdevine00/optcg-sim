import type { CardScript } from '../../src/dsl.ts';

/** OP17-102 Charlotte Oven. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_102: CardScript = {
  cardId: 'OP17-102',
  textHash: '0f4e7c14706e4e',
  verified: {
    source: 'cards/overrides/OP17-102.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Play up to 1 Character with 4000 power or less other than [Charlotte Oven] from your trash',
      kind: 'auto',
      when: ['onKO'],
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
                      power: {
                        lte: 4000,
                      },
                    },
                    {
                      not: {
                        name: 'Charlotte Oven',
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
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
